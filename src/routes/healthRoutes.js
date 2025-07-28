export function registerHealthRoutes(router) {
  router.get('/health', async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Service is healthy',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error });
    }
  });
}
