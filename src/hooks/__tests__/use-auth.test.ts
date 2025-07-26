import { renderHook, act, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useAuth } from "@/hooks/use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

// Mock all dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

describe("useAuth", () => {
  const mockPush = vi.fn();
  const mockSignInAction = vi.mocked(signInAction);
  const mockSignUpAction = vi.mocked(signUpAction);
  const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
  const mockClearAnonWork = vi.mocked(clearAnonWork);
  const mockGetProjects = vi.mocked(getProjects);
  const mockCreateProject = vi.mocked(createProject);
  const mockUseRouter = vi.mocked(useRouter);

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should return initial loading state as false", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn", () => {
    it("should successfully sign in and handle anonymous work", async () => {
      const mockAnonWork = {
        messages: [{ id: "1", content: "test message" }],
        fileSystemData: { "test.tsx": "test content" },
      };
      const mockProject = { id: "project-123", name: "Test Project" };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(mockAnonWork);
      mockCreateProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const signInResult = await result.current.signIn("test@example.com", "password");
        expect(signInResult.success).toBe(true);
      });

      expect(mockSignInAction).toHaveBeenCalledWith("test@example.com", "password");
      expect(mockGetAnonWorkData).toHaveBeenCalled();
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: mockAnonWork.messages,
        data: mockAnonWork.fileSystemData,
      });
      expect(mockClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-123");
    });

    it("should redirect to most recent project when no anonymous work exists", async () => {
      const mockProjects = [
        { id: "project-1", name: "Recent Project" },
        { id: "project-2", name: "Older Project" },
      ];

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-1");
    });

    it("should create new project when no projects exist", async () => {
      const mockNewProject = { id: "new-project-123", name: "New Design" };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue(mockNewProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/new-project-123");
    });

    it("should handle anonymous work without messages", async () => {
      const mockAnonWork = {
        messages: [],
        fileSystemData: { "test.tsx": "test content" },
      };
      const mockProjects = [{ id: "project-1", name: "Recent Project" }];

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(mockAnonWork);
      mockGetProjects.mockResolvedValue(mockProjects);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-1");
      expect(mockCreateProject).not.toHaveBeenCalled();
    });

    it("should handle sign in failure", async () => {
      mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const signInResult = await result.current.signIn("test@example.com", "wrong-password");
        expect(signInResult.success).toBe(false);
        expect(signInResult.error).toBe("Invalid credentials");
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should manage loading state correctly", async () => {
      let resolvePromise: (value: any) => void;
      const signInPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockSignInAction.mockReturnValue(signInPromise);
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "test", name: "test" });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      // Start the sign in process
      act(() => {
        result.current.signIn("test@example.com", "password");
      });

      // Check loading state is true
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ success: true });
        await signInPromise;
      });

      // Check loading state is reset
      expect(result.current.isLoading).toBe(false);
    });

    it("should reset loading state on error", async () => {
      mockSignInAction.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        try {
          await result.current.signIn("test@example.com", "password");
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    it("should successfully sign up and handle post-signin flow", async () => {
      const mockProject = { id: "new-project", name: "New Project" };

      mockSignUpAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const signUpResult = await result.current.signUp("new@example.com", "password");
        expect(signUpResult.success).toBe(true);
      });

      expect(mockSignUpAction).toHaveBeenCalledWith("new@example.com", "password");
      expect(mockCreateProject).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/new-project");
    });

    it("should handle sign up failure", async () => {
      mockSignUpAction.mockResolvedValue({ success: false, error: "Email already exists" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const signUpResult = await result.current.signUp("existing@example.com", "password");
        expect(signUpResult.success).toBe(false);
        expect(signUpResult.error).toBe("Email already exists");
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should manage loading state during sign up", async () => {
      let resolvePromise: (value: any) => void;
      const signUpPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockSignUpAction.mockReturnValue(signUpPromise);
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "test", name: "test" });

      const { result } = renderHook(() => useAuth());

      // Start the sign up process
      act(() => {
        result.current.signUp("test@example.com", "password");
      });

      // Check loading state is true
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ success: true });
        await signUpPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should handle errors in handlePostSignIn", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockImplementation(() => {
        throw new Error("Failed to get anon work");
      });

      const { result } = renderHook(() => useAuth());
      let errorThrown = false;

      await act(async () => {
        try {
          await result.current.signIn("test@example.com", "password");
        } catch (error) {
          errorThrown = true;
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(errorThrown).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle createProject failure", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockRejectedValue(new Error("Failed to create project"));

      const { result } = renderHook(() => useAuth());
      let errorThrown = false;

      await act(async () => {
        try {
          await result.current.signIn("test@example.com", "password");
        } catch (error) {
          errorThrown = true;
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(errorThrown).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle getProjects failure", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockRejectedValue(new Error("Failed to get projects"));

      const { result } = renderHook(() => useAuth());
      let errorThrown = false;

      await act(async () => {
        try {
          await result.current.signIn("test@example.com", "password");
        } catch (error) {
          errorThrown = true;
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(errorThrown).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle empty email and password", async () => {
      mockSignInAction.mockResolvedValue({ success: false, error: "Invalid input" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const result1 = await result.current.signIn("", "");
        expect(result1.success).toBe(false);
      });

      expect(mockSignInAction).toHaveBeenCalledWith("", "");
    });

    it("should handle undefined anonymous work data", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(undefined);
      mockGetProjects.mockResolvedValue([{ id: "project-1", name: "Test" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-1");
    });

    it("should handle anonymous work with empty fileSystemData", async () => {
      const mockAnonWork = {
        messages: [{ id: "1", content: "test" }],
        fileSystemData: {},
      };
      const mockProject = { id: "project-123", name: "Test Project" };

      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(mockAnonWork);
      mockCreateProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: mockAnonWork.messages,
        data: {},
      });
    });

    it("should generate unique project names", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "test", name: "test" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
    });
  });
});