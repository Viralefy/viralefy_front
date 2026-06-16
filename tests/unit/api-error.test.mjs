// Unit tests pro ApiError + tradução de erro 4xx pelo `request` interno.
//
// Round 29 introduziu ApiError(status, code, message) substituindo o
// `throw new Error(json.error.message)` que perdia metadata. Sem essas
// asserts a UX do round 29 (CTA "Sign in / Recover" no 409) pode regredir
// silenciosamente — o frontend só sabe a categoria do erro lendo o code.

import { test } from "node:test";
import assert from "node:assert/strict";

import { ApiError, userRegister, userLogin } from "../../src/lib/api.ts";

// fetch stub: cada test seta uma resposta e libera no final.
function withFetchMock(response, fn) {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => response;
  try {
    return fn();
  } finally {
    globalThis.fetch = orig;
  }
}

function makeResponse({ status, body }) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test("ApiError class preserves status + code + message", () => {
  const e = new ApiError(409, "CONFLICT", "email already registered");
  assert.equal(e.name, "ApiError");
  assert.equal(e.status, 409);
  assert.equal(e.code, "CONFLICT");
  assert.equal(e.message, "email already registered");
  assert.ok(e instanceof Error, "ApiError must extend Error");
});

test("userRegister: 409 CONFLICT throws ApiError com code=CONFLICT", async () => {
  await withFetchMock(
    makeResponse({
      status: 409,
      body: {
        error: {
          code: "CONFLICT",
          message: "email already registered",
          trace_id: "abc-123",
        },
      },
    }),
    async () => {
      await assert.rejects(
        userRegister({
          email: "existing@example.com",
          name: "User",
          password: "Password123!",
          phone: "+5511999999999",
        }),
        (err) => {
          assert.ok(err instanceof ApiError, "must throw ApiError, got " + err.constructor.name);
          assert.equal(err.status, 409);
          assert.equal(err.code, "CONFLICT");
          assert.equal(err.message, "email already registered");
          return true;
        }
      );
    }
  );
});

test("userLogin: 401 UNAUTHORIZED throws ApiError com code=UNAUTHORIZED", async () => {
  await withFetchMock(
    makeResponse({
      status: 401,
      body: {
        error: { code: "UNAUTHORIZED", message: "unauthorized", trace_id: "xyz" },
      },
    }),
    async () => {
      await assert.rejects(userLogin("a@b.com", "wrongpass", ""), (err) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 401);
        assert.equal(err.code, "UNAUTHORIZED");
        return true;
      });
    }
  );
});

test("userLogin: 429 RATE_LIMITED throws ApiError com code=RATE_LIMITED", async () => {
  await withFetchMock(
    makeResponse({
      status: 429,
      body: {
        error: { code: "RATE_LIMITED", message: "too many requests" },
      },
    }),
    async () => {
      await assert.rejects(userLogin("a@b.com", "pass", ""), (err) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.code, "RATE_LIMITED");
        return true;
      });
    }
  );
});

test("request: body sem 'error' field cai em REQUEST_FAILED (defesa)", async () => {
  await withFetchMock(
    {
      ok: false,
      status: 502,
      json: async () => ({}),
    },
    async () => {
      await assert.rejects(userLogin("a@b.com", "pass", ""), (err) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 502);
        assert.equal(err.code, "REQUEST_FAILED");
        return true;
      });
    }
  );
});

test("request: body com JSON inválido não crasha (catch silencia)", async () => {
  await withFetchMock(
    {
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("invalid json");
      },
    },
    async () => {
      await assert.rejects(userLogin("a@b.com", "pass", ""), (err) => {
        assert.ok(err instanceof ApiError);
        assert.equal(err.status, 500);
        assert.equal(err.code, "REQUEST_FAILED");
        return true;
      });
    }
  );
});
