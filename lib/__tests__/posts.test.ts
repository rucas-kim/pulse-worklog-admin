import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { ensureSafePath, getContentDir } from "@/lib/posts";

describe("ensureSafePath", () => {
  let tmp: string;
  const orig = process.env.CONTENT_DIR;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pulse-worklog-test-"));
    process.env.CONTENT_DIR = tmp;
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
    if (orig === undefined) delete process.env.CONTENT_DIR;
    else process.env.CONTENT_DIR = orig;
  });

  it("CONTENT_DIR 안쪽 경로는 통과", () => {
    expect(() => ensureSafePath(path.join(tmp, "_drafts/foo.md"))).not.toThrow();
    expect(() => ensureSafePath(path.join(tmp, "_published/2026-05/bar.md"))).not.toThrow();
  });

  it("CONTENT_DIR 바깥 경로는 throw", () => {
    expect(() => ensureSafePath("/etc/passwd")).toThrow(/outside CONTENT_DIR/);
    expect(() => ensureSafePath(path.join(tmp, "../escape.md"))).toThrow();
    expect(() => ensureSafePath(path.join(tmp, "..", "escape.md"))).toThrow();
  });

  it("같은 prefix를 가진 형제 디렉토리는 차단 (path.sep 경계까지 비교)", () => {
    // /tmp/X-test-abc 라는 CONTENT_DIR과 /tmp/X-test-abc-sibling/foo.md는
    // 단순 startsWith로는 매칭되어 보안 구멍이 됨 — 분리자 경계로 정확히 비교해야 함.
    const sibling = `${tmp}-sibling/foo.md`;
    expect(() => ensureSafePath(sibling)).toThrow();
  });

  it("CONTENT_DIR 자체 경로는 통과 (예: 루트 자체 접근)", () => {
    expect(() => ensureSafePath(tmp)).not.toThrow();
  });

  it("CONTENT_DIR 미설정 시 getContentDir이 명확히 throw", () => {
    delete process.env.CONTENT_DIR;
    expect(() => getContentDir()).toThrow(/CONTENT_DIR/);
  });
});
