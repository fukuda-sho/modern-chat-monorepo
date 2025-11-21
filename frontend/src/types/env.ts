export interface RuntimeEnvConfig {
  /**
   * Base URL for RESTful API calls (e.g., http://backend:3000)
   */
  apiUrl: string;
  /**
   * Base URL used by Socket.IO clients (generally API URL without trailing /api)
   */
  socketUrl: string;
}
