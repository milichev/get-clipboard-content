export type ArrayItems<A extends readonly any[]> = {
    [K in keyof A]: A[K];
  }[number];
  