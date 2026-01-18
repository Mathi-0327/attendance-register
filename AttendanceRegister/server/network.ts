import { networkInterfaces } from "os";

export interface NetworkConfig {
  serverIp: string;
  networkPrefix: string; // e.g., "192.168.1"
  allowedSubnet: string; // e.g., "192.168.1.0/24"
}

let networkConfig: NetworkConfig | null = null;

/**
 * Get the server's local network IP address
 */
export function getServerLocalIp(): string {
  const interfaces = networkInterfaces();

  // Priority order: look for common local network interfaces
  const priorityOrder = ["Wi-Fi", "Ethernet", "eth0", "wlan0", "en0"];

  for (const priority of priorityOrder) {
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (name.toLowerCase().includes(priority.toLowerCase())) {
        for (const addr of addrs || []) {
          if (addr.family === "IPv4" && !addr.internal) {
            return addr.address;
          }
        }
      }
    }
  }

  // Fallback: find any non-internal IPv4 address
  for (const addrs of Object.values(interfaces)) {
    for (const addr of addrs || []) {
      if (addr.family === "IPv4" && !addr.internal) {
        return addr.address;
      }
    }
  }

  // Last resort: return localhost
  return "127.0.0.1";
}

/**
 * Extract network prefix from IP address (e.g., "192.168.1.5" -> "192.168.1")
 */
export function getNetworkPrefix(ip: string): string {
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  return ip;
}

/**
 * Check if an IP address is on the same local network
 */
export function isSameNetwork(clientIp: string, serverIp: string): boolean {
  // Allow localhost for development
  if (clientIp === "127.0.0.1" || clientIp === "::1" || clientIp === "::ffff:127.0.0.1") {
    return true;
  }

  // Handle IPv4-mapped IPv6 addresses
  if (clientIp.startsWith("::ffff:")) {
    clientIp = clientIp.substring(7);
  }

  // Remove IPv6 prefix if present
  if (clientIp.includes("::")) {
    return false; // IPv6 addresses from different networks
  }

  const clientPrefix = getNetworkPrefix(clientIp);
  const serverPrefix = getNetworkPrefix(serverIp);

  return clientPrefix === serverPrefix;
}

/**
 * Initialize and get network configuration
 */
export function getNetworkConfig(): NetworkConfig {
  if (!networkConfig) {
    const serverIp = getServerLocalIp();
    const networkPrefix = getNetworkPrefix(serverIp);

    networkConfig = {
      serverIp,
      networkPrefix,
      allowedSubnet: `${networkPrefix}.0/24`,
    };

    console.log(`[network] Server IP: ${serverIp}`);
    console.log(`[network] Network prefix: ${networkPrefix}`);
    console.log(`[network] Allowed subnet: ${networkConfig.allowedSubnet}`);
  }

  return networkConfig;
}

/**
 * Validate if a client IP is allowed (same network)
 */
export function validateClientIp(clientIp: string): { allowed: boolean; reason?: string } {
  const config = getNetworkConfig();

  if (!clientIp || clientIp === "unknown") {
    return { allowed: false, reason: "Could not determine client IP address" };
  }

  if (!isSameNetwork(clientIp, config.serverIp)) {
    return {
      allowed: false,
      reason: `Access denied: Client IP (${clientIp}) is not on the same network as server (${config.serverIp}). Only devices on the same Wi-Fi network can access this system.`,
    };
  }

  return { allowed: true };
}
