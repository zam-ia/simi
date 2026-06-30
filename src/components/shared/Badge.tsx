import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "green" | "gray" | "red" | "purple";
};

const tones = {
  green: "bg-green-100 text-green-700 dark:bg-green-900/35 dark:text-green-200",
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  red: "bg-red-100 text-red-700 dark:bg-red-900/35 dark:text-red-200",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/35 dark:text-purple-200"
};

export function Badge({ children, tone = "gray" }: BadgeProps) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}
