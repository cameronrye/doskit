/**
 * Tests for DOSBox configuration
 */

import { describe, it, expect } from "vitest";
import { defaultDosboxConfig } from "./dosbox.conf";

describe("dosbox.conf", () => {
  describe("defaultDosboxConfig", () => {
    it("should be a non-empty string", () => {
      expect(typeof defaultDosboxConfig).toBe("string");
      expect(defaultDosboxConfig.length).toBeGreaterThan(0);
    });

    it("should contain CPU configuration", () => {
      expect(defaultDosboxConfig).toContain("[cpu]");
      expect(defaultDosboxConfig).toContain("core=dynamic");
      expect(defaultDosboxConfig).toContain("cycles=25000");
    });

    it("should contain render configuration", () => {
      expect(defaultDosboxConfig).toContain("[render]");
      expect(defaultDosboxConfig).toContain("scaler=none");
      expect(defaultDosboxConfig).toContain("aspect=false");
    });

    it("should contain mixer configuration for audio quality", () => {
      expect(defaultDosboxConfig).toContain("[mixer]");
      expect(defaultDosboxConfig).toContain("rate=44100");
      expect(defaultDosboxConfig).toContain("blocksize=2048");
      expect(defaultDosboxConfig).toContain("prebuffer=64");
    });

    it("should contain video configuration", () => {
      expect(defaultDosboxConfig).toContain("[video]");
      expect(defaultDosboxConfig).toContain("vmemsize=8");
    });

    it("should contain DOS configuration", () => {
      expect(defaultDosboxConfig).toContain("[dos]");
      expect(defaultDosboxConfig).toContain("ver=7.1");
      expect(defaultDosboxConfig).toContain("umb=true");
      expect(defaultDosboxConfig).toContain("ems=true");
      expect(defaultDosboxConfig).toContain("xms=true");
    });

    it("should contain Sound Blaster configuration", () => {
      expect(defaultDosboxConfig).toContain("[sblaster]");
      expect(defaultDosboxConfig).toContain("sbtype=sb16");
      expect(defaultDosboxConfig).toContain("oplrate=44100");
    });

    it("should contain autoexec section", () => {
      expect(defaultDosboxConfig).toContain("[autoexec]");
      expect(defaultDosboxConfig).toContain("DosKit");
    });

    it("should have welcome message", () => {
      expect(defaultDosboxConfig).toContain("DosKit - DOS Environment");
      expect(defaultDosboxConfig).toContain("Type 'help' for DOS commands");
    });
  });

  describe("Configuration validity", () => {
    it("should have required sections", () => {
      expect(defaultDosboxConfig).toContain("[cpu]");
      expect(defaultDosboxConfig).toContain("[autoexec]");
    });

    it("should be properly formatted", () => {
      // Should have section headers
      expect(defaultDosboxConfig.match(/\[.*\]/g)).toBeTruthy();
      // Should have key=value pairs
      expect(defaultDosboxConfig.match(/\w+=\w+/g)).toBeTruthy();
    });
  });
});
