"use client";

import { Loader2, FileEdit, FileText, FilePlus } from "lucide-react";

interface ToolInvocationProps {
  toolName: string;
  args?: any;
  state: "partial-call" | "result";
  result?: any;
}

export function ToolInvocation({ toolName, args, state, result }: ToolInvocationProps) {
  const getToolMessage = () => {
    // Map tool names to user-friendly messages
    switch (toolName) {
      case "str_replace_editor":
      case "str_replace_based_edit_tool":
      case "edit_file":
        if (args?.path || args?.file_path) {
          const fileName = (args.path || args.file_path).split('/').pop();
          return {
            icon: FileEdit,
            message: `Editing file: ${fileName}`,
            description: "Making changes to the code"
          };
        }
        return {
          icon: FileEdit,
          message: "Editing file",
          description: "Making changes to the code"
        };
      
      case "create_file":
      case "write_file":
        if (args?.path || args?.file_path) {
          const fileName = (args.path || args.file_path).split('/').pop();
          return {
            icon: FilePlus,
            message: `Creating file: ${fileName}`,
            description: "Writing new code"
          };
        }
        return {
          icon: FilePlus,
          message: "Creating file",
          description: "Writing new code"
        };
      
      case "read_file":
      case "view_file":
        if (args?.path || args?.file_path) {
          const fileName = (args.path || args.file_path).split('/').pop();
          return {
            icon: FileText,
            message: `Reading file: ${fileName}`,
            description: "Examining the code"
          };
        }
        return {
          icon: FileText,
          message: "Reading file",
          description: "Examining the code"
        };
      
      default:
        // Fallback for unknown tools
        return {
          icon: FileText,
          message: toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: "Processing..."
        };
    }
  };

  const { icon: Icon, message, description } = getToolMessage();
  const isComplete = state === "result" && result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <Icon className="w-3.5 h-3.5 text-neutral-600" />
      <div className="flex flex-col">
        <span className="text-xs font-medium text-neutral-700">{message}</span>
        {!isComplete && (
          <span className="text-xs text-neutral-500">{description}</span>
        )}
      </div>
    </div>
  );
}