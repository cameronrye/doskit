/**
 * Tests for DOSBox Configuration Builder
 */

import { describe, it, expect } from "vitest";
import { createDOSBoxConfig, presets } from "./dosboxConfigBuilder";

describe("DOSBoxConfigBuilder", () => {
  describe("Basic configuration", () => {
    it("should create an empty configuration", () => {
      const config = createDOSBoxConfig().build();
      expect(config).toBe("");
    });

    it("should create CPU configuration", () => {
      const config = createDOSBoxConfig()
        .setCPU({ core: "auto", cputype: "pentium", cycles: 15000 })
        .build();

      expect(config).toContain("[cpu]");
      expect(config).toContain("core=auto");
      expect(config).toContain("cputype=pentium");
      expect(config).toContain("cycles=15000");
    });

    it("should create video configuration", () => {
      const config = createDOSBoxConfig().setVideo({ vmemsize: 8 }).build();

      expect(config).toContain("[video]");
      expect(config).toContain("vmemsize=8");
    });

    it("should create DOS configuration", () => {
      const config = createDOSBoxConfig()
        .setDOS({ ver: "7.1", umb: true, ems: true, xms: true })
        .build();

      expect(config).toContain("[dos]");
      expect(config).toContain("ver=7.1");
      expect(config).toContain("umb=true");
      expect(config).toContain("ems=true");
      expect(config).toContain("xms=true");
    });

    it("should create Sound Blaster configuration", () => {
      const config = createDOSBoxConfig()
        .setSoundBlaster({
          sbtype: "sb16",
          sbbase: 220,
          irq: 7,
          dma: 1,
          hdma: 5,
        })
        .build();

      expect(config).toContain("[sblaster]");
      expect(config).toContain("sbtype=sb16");
      expect(config).toContain("sbbase=220");
      expect(config).toContain("irq=7");
      expect(config).toContain("dma=1");
      expect(config).toContain("hdma=5");
    });

    it("should create autoexec section", () => {
      const config = createDOSBoxConfig()
        .addAutoexec("@echo off", "mount c .", "c:", "dir")
        .build();

      expect(config).toContain("[autoexec]");
      expect(config).toContain("@echo off");
      expect(config).toContain("mount c .");
      expect(config).toContain("c:");
      expect(config).toContain("dir");
    });
  });

  describe("Chaining", () => {
    it("should support method chaining", () => {
      const config = createDOSBoxConfig()
        .setCPU({ core: "auto" })
        .setVideo({ vmemsize: 8 })
        .setDOS({ ver: "7.1" })
        .addAutoexec("@echo off")
        .build();

      expect(config).toContain("[cpu]");
      expect(config).toContain("[video]");
      expect(config).toContain("[dos]");
      expect(config).toContain("[autoexec]");
    });

    it("should merge multiple calls to the same setter", () => {
      const config = createDOSBoxConfig()
        .setCPU({ core: "auto" })
        .setCPU({ cycles: "max" })
        .build();

      expect(config).toContain("core=auto");
      expect(config).toContain("cycles=max");
    });
  });

  describe("Presets", () => {
    it("should create default preset", () => {
      const config = presets.default().build();

      expect(config).toContain("[cpu]");
      expect(config).toContain("core=dynamic");
      expect(config).toContain("cycles=25000");
      expect(config).toContain("[video]");
      expect(config).toContain("vmemsize=8");
      expect(config).toContain("[render]");
      expect(config).toContain("scaler=none");
      expect(config).toContain("[mixer]");
      expect(config).toContain("rate=44100");
      expect(config).toContain("blocksize=2048");
      expect(config).toContain("[sblaster]");
      expect(config).toContain("sbtype=sb16");
    });

    it("should create music tracker preset", () => {
      const config = presets.musicTracker().build();

      expect(config).toContain("[cpu]");
      expect(config).toContain("core=dynamic");
      expect(config).toContain("cputype=pentium");
      expect(config).toContain("cycles=18000");
      expect(config).toContain("[mixer]");
      expect(config).toContain("blocksize=2048");
      expect(config).toContain("[memory]");
      expect(config).toContain("memsize=16");
    });

    it("should create demo preset", () => {
      const config = presets.demo().build();

      expect(config).toContain("[cpu]");
      expect(config).toContain("cycles=30000");
      expect(config).toContain("[video]");
      expect(config).toContain("vmemsize=8");
    });

    it("should allow customizing presets", () => {
      const config = presets
        .default()
        .setCPU({ cycles: 10000 })
        .addAutoexec("@echo off", "echo Custom autoexec")
        .build();

      expect(config).toContain("cycles=10000");
      expect(config).toContain("[autoexec]");
      expect(config).toContain("echo Custom autoexec");
    });
  });
});
