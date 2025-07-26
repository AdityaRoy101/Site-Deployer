import simpleGit from 'simple-git';

const cloneRepo = async (repoUrl, destPath, options = {}) => {
  const git = simpleGit();
  const cloneOptions = options.shallow ? ['--depth=1'] : [];
  await git.clone(repoUrl, destPath, cloneOptions);
  return destPath;
};

export default cloneRepo;