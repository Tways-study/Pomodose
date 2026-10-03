import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { renderChatText } from "./render-chat-text";

function html(text: string): string {
  const { container } = render(<div>{renderChatText(text)}</div>);
  return container.innerHTML;
}

describe("renderChatText", () => {
  it("splits blank-line separated blocks into paragraphs", () => {
    const { container } = render(<div>{renderChatText("one\n\ntwo")}</div>);
    expect(container.querySelectorAll("p")).toHaveLength(2);
  });

  it("renders bold, italic and inline code", () => {
    const { container } = render(<div>{renderChatText("a **bold** and *soft* and `code`")}</div>);
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("em")?.textContent).toBe("soft");
    expect(container.querySelector("code")?.textContent).toBe("code");
  });

  it("renders bullet and numbered lists", () => {
    const { container } = render(<div>{renderChatText("- a\n- b\n\n1. x\n2. y")}</div>);
    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
  });

  it("leaves unclosed markers literal while a reply is still streaming", () => {
    expect(html("this is **half")).toContain("**half");
    expect(html("this is **half")).not.toContain("<strong");
  });

  it("keeps raw HTML inert as text", () => {
    const { container } = render(<div>{renderChatText("<script>alert(1)</script>")}</div>);
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>alert(1)</script>");
  });
});
