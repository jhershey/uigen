import { describe, test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocation } from "../ToolInvocation";

afterEach(() => {
  cleanup();
});

describe("ToolInvocation", () => {
  describe("str_replace_editor tool", () => {
    test("should display user-friendly message for file editing", () => {
      render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ path: "/src/components/Card.tsx" }}
          state="partial-call"
        />
      );

      expect(screen.getByText("Editing file: Card.tsx")).toBeDefined();
      expect(screen.getByText("Making changes to the code")).toBeDefined();
    });

    test("should show loading state when in progress", () => {
      const { container } = render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ file_path: "/src/App.tsx" }}
          state="partial-call"
        />
      );

      // Check for loading spinner
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
      expect(screen.getByText("Making changes to the code")).toBeDefined();
    });

    test("should show completed state with green dot", () => {
      const { container } = render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ path: "/src/index.ts" }}
          state="result"
          result={{ success: true }}
        />
      );

      // Check for green completion dot
      const completionDot = container.querySelector(".bg-emerald-500");
      expect(completionDot).toBeDefined();
      
      // Should not show description when complete
      expect(screen.queryByText("Making changes to the code")).toBeNull();
    });
  });

  describe("create_file tool", () => {
    test("should display correct message for file creation", () => {
      render(
        <ToolInvocation
          toolName="create_file"
          args={{ path: "/src/components/Button.tsx" }}
          state="partial-call"
        />
      );

      expect(screen.getByText("Creating file: Button.tsx")).toBeDefined();
      expect(screen.getByText("Writing new code")).toBeDefined();
    });

    test("should handle write_file tool name", () => {
      render(
        <ToolInvocation
          toolName="write_file"
          args={{ file_path: "/src/utils/helpers.ts" }}
          state="partial-call"
        />
      );

      expect(screen.getByText("Creating file: helpers.ts")).toBeDefined();
    });
  });

  describe("read_file tool", () => {
    test("should display correct message for file reading", () => {
      render(
        <ToolInvocation
          toolName="read_file"
          args={{ path: "/package.json" }}
          state="partial-call"
        />
      );

      expect(screen.getByText("Reading file: package.json")).toBeDefined();
      expect(screen.getByText("Examining the code")).toBeDefined();
    });

    test("should handle view_file tool name", () => {
      render(
        <ToolInvocation
          toolName="view_file"
          args={{ file_path: "/README.md" }}
          state="partial-call"
        />
      );

      expect(screen.getByText("Reading file: README.md")).toBeDefined();
    });
  });

  describe("edge cases", () => {
    test("should handle missing file path", () => {
      render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{}}
          state="partial-call"
        />
      );

      expect(screen.getByText("Editing file")).toBeDefined();
      expect(screen.getByText("Making changes to the code")).toBeDefined();
    });

    test("should handle unknown tool names", () => {
      render(
        <ToolInvocation
          toolName="unknown_tool_name"
          args={{}}
          state="partial-call"
        />
      );

      // Should format the tool name by replacing underscores and capitalizing
      expect(screen.getByText("Unknown Tool Name")).toBeDefined();
      expect(screen.getByText("Processing...")).toBeDefined();
    });

    test("should extract filename from nested paths", () => {
      render(
        <ToolInvocation
          toolName="edit_file"
          args={{ path: "/very/deeply/nested/folder/structure/MyComponent.tsx" }}
          state="partial-call"
        />
      );

      expect(screen.getByText("Editing file: MyComponent.tsx")).toBeDefined();
    });

    test("should handle both path and file_path args", () => {
      // Test with 'path'
      const { rerender } = render(
        <ToolInvocation
          toolName="create_file"
          args={{ path: "/src/FileA.tsx" }}
          state="partial-call"
        />
      );
      expect(screen.getByText("Creating file: FileA.tsx")).toBeDefined();

      // Test with 'file_path'
      rerender(
        <ToolInvocation
          toolName="create_file"
          args={{ file_path: "/src/FileB.tsx" }}
          state="partial-call"
        />
      );
      expect(screen.getByText("Creating file: FileB.tsx")).toBeDefined();
    });
  });

  describe("visual styling", () => {
    test("should have correct styling classes", () => {
      const { container } = render(
        <ToolInvocation
          toolName="str_replace_editor"
          args={{ path: "/test.ts" }}
          state="partial-call"
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper?.className).toContain("inline-flex");
      expect(wrapper?.className).toContain("items-center");
      expect(wrapper?.className).toContain("gap-2");
      expect(wrapper?.className).toContain("mt-2");
      expect(wrapper?.className).toContain("px-3");
      expect(wrapper?.className).toContain("py-1.5");
      expect(wrapper?.className).toContain("bg-neutral-50");
      expect(wrapper?.className).toContain("rounded-lg");
      expect(wrapper?.className).toContain("border");
      expect(wrapper?.className).toContain("border-neutral-200");
    });
  });
});