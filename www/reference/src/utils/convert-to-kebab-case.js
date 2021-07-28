export const convertToKebabCase = string => {
  return string
    .replace(/\s+/g, "-")
    .replace("'", "")
    .replace(".", "")
    .toLowerCase()
}
