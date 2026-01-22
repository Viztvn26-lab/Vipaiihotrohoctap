// Fixes errors: "Cannot find type definition file for 'vite/client'" and conflicting 'process' type definition.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
