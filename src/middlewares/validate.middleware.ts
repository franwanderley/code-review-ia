import { NextFunction, Request, Response } from 'express'
import { ZodError, ZodType } from 'zod'

type ValidationTarget = 'body' | 'params' | 'query'

export function validate(schema: ZodType, target: ValidationTarget = 'body') {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const result = await schema.safeParseAsync(req[target])

    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error)
      res
        .status(400)
        .json({ message: 'Validation error', errors: formattedErrors })
      return
    }

    req[target] = result.data
    next()
  }
}

function formatZodErrors(error: ZodError) {
  return error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
  }))
}
