import { isObject } from "lodash"

import { globalVariableSelector } from "@/module/selector/vim-variable"
import { pluginGetVar } from "@/plugin"
import type { AddFzfArg, CustomProcessesVimVariable, FzfOptions, Processes, ResumeQuery, UserProcesses } from "@/type"

const defaultBind = [
  {
    key: "ctrl-d",
    action: "preview-page-down",
  },
  {
    key: "ctrl-u",
    action: "preview-page-up",
  },
  {
    key: "?",
    action: "toggle-preview",
  },
] as const

export const defaultOptions: FzfOptions = {
  "--ansi": true,
  // alt-enter is workaround
  "--expect": ["alt-enter"],
  "--bind": defaultBind,
} as const

const isCustomProcessesVimVariable = (
  variable: unknown,
  userProcesses: UserProcesses
): variable is CustomProcessesVimVariable => {
  if (userProcesses.type !== "custom_processes_variable") {
    return false
  }

  return isObject(variable) && isObject((variable as CustomProcessesVimVariable)[userProcesses.value])
}

const getExpectFromDefaultProcesses = (defaultProcesses: Processes): FzfOptions => {
  return { "--expect": defaultProcesses.map(({ key }) => key).filter((key) => key !== "enter") }
}

const getPreviewWindowOption = (): FzfOptions => {
  const previewWindowOptionVimValue = globalVariableSelector("fzfPreviewFzfPreviewWindowOption")
  return previewWindowOptionVimValue == null || previewWindowOptionVimValue === ""
    ? {}
    : { "--preview-window": `"${previewWindowOptionVimValue as string}"` }
}

const getColorOption = (): FzfOptions => {
  const colorOptionVimValue = globalVariableSelector("fzfPreviewFzfColorOption")
  return colorOptionVimValue == null || colorOptionVimValue === ""
    ? {}
    : { "--color": `"${colorOptionVimValue as string}"` }
}

const getExpectFromUserProcesses = async (userProcesses: UserProcesses | undefined): Promise<FzfOptions> => {
  if (userProcesses == null) {
    return {}
  }

  if (userProcesses.type === "global_variable") {
    const userProcessesGlobalVariable = await pluginGetVar(userProcesses.value)

    if (isObject(userProcessesGlobalVariable)) {
      return {
        "--expect": Object.entries(userProcessesGlobalVariable)
          .map(([key]) => key)
          .filter((key) => key !== "enter"),
      }
    }
  }

  if (userProcesses.type === "custom_processes_variable") {
    const userProcessesCustomVariable = globalVariableSelector("fzfPreviewCustomProcesses")

    if (isCustomProcessesVimVariable(userProcessesCustomVariable, userProcesses)) {
      return {
        "--expect": Object.entries(userProcessesCustomVariable[userProcesses.value])
          .map(([key]) => key)
          .filter((key) => key !== "enter"),
      }
    }
  }

  throw new Error("--processes must be dictionary variable")
}

type OptionsArgs = {
  fzfCommandDefaultOptions: FzfOptions
  defaultProcesses: Processes
  userProcesses?: UserProcesses
  userOptions: Array<AddFzfArg>
  resumeQuery?: ResumeQuery
}

export const generateOptions = async ({
  fzfCommandDefaultOptions,
  defaultProcesses,
  userProcesses,
  userOptions,
  resumeQuery,
}: OptionsArgs): Promise<FzfOptions> => {
  const resumeQueryOption: FzfOptions = resumeQuery == null ? {} : { "--query": `"${resumeQuery}"` }

  const fzfCommandOptions = {
    ...defaultOptions,
    ...fzfCommandDefaultOptions,
    ...getExpectFromDefaultProcesses(defaultProcesses),
    ...getPreviewWindowOption(),
    ...getColorOption(),
    ...(await getExpectFromUserProcesses(userProcesses)),
    ...resumeQueryOption,
  }

  userOptions.forEach((userOption) => {
    fzfCommandOptions[userOption.optionName] = userOption.value
  })

  return fzfCommandOptions
}