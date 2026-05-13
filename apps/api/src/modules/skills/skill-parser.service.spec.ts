import { describe, it, expect, beforeEach } from "vitest";
import { SkillParserService } from "./skill-parser.service.js";

describe("SkillParserService", () => {
  let parser: SkillParserService;

  beforeEach(() => {
    parser = new SkillParserService();
  });

  describe("parseSkillFile", () => {
    it("extracts name and description from frontmatter", () => {
      const raw = `---
name: My Skill
description: Does something useful
---
# Body content`;

      const { frontmatter, body } = parser.parseSkillFile(raw);
      expect(frontmatter.name).toBe("My Skill");
      expect(frontmatter.description).toBe("Does something useful");
      expect(body).toBe("# Body content");
    });

    it("defaults name to 'Unnamed Skill' when missing", () => {
      const raw = `---
description: Has description
---
body`;

      const { frontmatter } = parser.parseSkillFile(raw);
      expect(frontmatter.name).toBe("Unnamed Skill");
    });

    it("defaults description to 'No description' when missing", () => {
      const raw = `---
name: My Skill
---
body`;

      const { frontmatter } = parser.parseSkillFile(raw);
      expect(frontmatter.description).toBe("No description");
    });

    it("handles missing frontmatter block entirely", () => {
      const raw = `Just plain content, no frontmatter`;

      const { frontmatter, body } = parser.parseSkillFile(raw);
      expect(frontmatter.name).toBe("Unnamed Skill");
      expect(frontmatter.description).toBe("No description");
      expect(body).toBe("Just plain content, no frontmatter");
    });

    it("preserves extra frontmatter fields", () => {
      const raw = `---
name: My Skill
description: Desc
license: MIT
---
body`;

      const { frontmatter } = parser.parseSkillFile(raw);
      expect(frontmatter.license).toBe("MIT");
    });

    it("trims leading/trailing whitespace from body", () => {
      const raw = `---
name: My Skill
description: Desc
---

  body with space
`;

      const { body } = parser.parseSkillFile(raw);
      expect(body).toBe("body with space");
    });
  });

  describe("parseRuleFile", () => {
    it("parses frontmatter and body", () => {
      const raw = `---
title: My Rule
severity: error
---
Rule body text`;

      const { frontmatter, body } = parser.parseRuleFile(raw);
      expect(frontmatter["title"]).toBe("My Rule");
      expect(frontmatter["severity"]).toBe("error");
      expect(body).toBe("Rule body text");
    });

    it("handles rule file with no frontmatter", () => {
      const raw = `Just rule content`;

      const { frontmatter, body } = parser.parseRuleFile(raw);
      expect(frontmatter).toEqual({});
      expect(body).toBe("Just rule content");
    });
  });
});
