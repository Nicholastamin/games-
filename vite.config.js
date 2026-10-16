
export default {
  base: process.env.GITHUB_ACTIONS
    ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/`
    : "/"
};
