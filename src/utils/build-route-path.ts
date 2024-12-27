export function buildRoutePath(path: string) {
  const routeParametersRegex = /:([a-zA-Z]+)/g;
  const pathWithParams = path.replaceAll(
    routeParametersRegex,
    "(?<$1>[a-z0-9-_]+)"
  );

  // ?<query> = New group called query
  // () = group
  // ?$ = optional and ends
  // (.*) = any char infinite times
  const pathRegex = new RegExp(`^${pathWithParams}(?<query>\\?(.*))?$`);

  return pathRegex;
}
