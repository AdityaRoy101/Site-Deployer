import { deployStaticApp } from '../../components/frontendDeployer/frontendDeployment.js';

export const frontendDeploymentController = async (req, res, next) => {
  try {
    const { githubUrl, projectName, buildCommand, outputDir } = req.body;

    const result = await deployStaticApp({
      githubUrl,
      projectName,
      buildCommand,
      outputDir
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
