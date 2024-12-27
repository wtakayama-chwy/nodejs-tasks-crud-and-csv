// ['search=Diego', 'page=2']
// ['search', 'Diego']
// ['page', '2']

export function extractQueryParams(query: string) {
  return query
    .substr(1)
    .split("&")
    .reduce((queryParams, param) => {
      const [key, value] = param.split("=");
      queryParams[key] = value;
      return queryParams;
    }, {} as Record<string, string>);
}
