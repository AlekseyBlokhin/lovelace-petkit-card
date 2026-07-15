import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

// The blueprint uses HA's `!input` YAML tag, which js-yaml doesn't know
// about by default. We only need structural validity here (this doesn't
// need a full Home Assistant instance to validate) — so register a
// permissive custom schema that accepts `!input <name>` anywhere a value
// is expected, resolving it to a small marker object.
const INPUT_TAG = new yaml.Type('!input', {
  kind: 'scalar',
  construct: (name) => ({ __input__: name }),
});
const HA_SCHEMA = yaml.DEFAULT_SCHEMA.extend([INPUT_TAG]);

const here = path.dirname(fileURLToPath(import.meta.url));
const blueprintPath = path.resolve(here, '../../blueprints/automation/petkit_per_cat_visit_tracker.yaml');

describe('petkit_per_cat_visit_tracker blueprint', () => {
  it('is present on disk', () => {
    expect(fs.existsSync(blueprintPath)).toBe(true);
  });

  it('parses as valid YAML', () => {
    const source = fs.readFileSync(blueprintPath, 'utf8');
    expect(() => yaml.load(source, { schema: HA_SCHEMA })).not.toThrow();
  });

  it('has the expected top-level automation Blueprint keys', () => {
    const source = fs.readFileSync(blueprintPath, 'utf8');
    const doc = yaml.load(source, { schema: HA_SCHEMA });
    expect(doc).toHaveProperty('blueprint');
    expect(doc).toHaveProperty('triggers');
    expect(doc).toHaveProperty('conditions');
    expect(doc).toHaveProperty('actions');
    expect(doc.blueprint.domain).toBe('automation');
  });

  it('declares the three documented input groups', () => {
    const source = fs.readFileSync(blueprintPath, 'utf8');
    const doc = yaml.load(source, { schema: HA_SCHEMA });
    const inputKeys = Object.keys(doc.blueprint.input);
    expect(inputKeys).toEqual(['sensors', 'cats', 'settings']);
  });

  it('uses an object selector with multiple:true for the variable-length cat mapping (not a fixed number of slots)', () => {
    const source = fs.readFileSync(blueprintPath, 'utf8');
    const doc = yaml.load(source, { schema: HA_SCHEMA });
    const catMapping = doc.blueprint.input.cats.input.cat_mapping;
    expect(catMapping.selector.object.multiple).toBe(true);
    expect(catMapping.selector.object.fields).toHaveProperty('cat_name');
    expect(catMapping.selector.object.fields).toHaveProperty('duration_helper');
  });

  it('binds every !input used inside a template to a variables entry (never inlines !input directly in Jinja)', () => {
    const source = fs.readFileSync(blueprintPath, 'utf8');
    const doc = yaml.load(source, { schema: HA_SCHEMA });
    // `variables:` at the top level must resolve the !input tags that
    // conditions/actions' templates reference by name. `!input` is a YAML
    // tag, not a template value — it can't be used inside `{{ }}` directly,
    // which is the exact mistake an earlier draft of this blueprint made.
    expect(doc.variables.cats).toEqual({ __input__: 'cat_mapping' });
    expect(doc.variables.last_used_by_entity).toEqual({ __input__: 'last_used_by_entity' });
    expect(doc.variables.max_delta).toEqual({ __input__: 'max_valid_delta' });

    // Directly asserting against the raw source (rather than the parsed
    // doc): no line containing a Jinja delimiter (`{{`) may also contain
    // the literal text `!input` — that combination is the "earlier draft"
    // anti-pattern this test guards against. (Using `!input` as a plain
    // non-template value, e.g. `seconds: !input settle_delay`, is fine and
    // expected — only its use *inside* `{{ }}` is invalid.)
    const offendingLines = source.split('\n').filter((line) => line.includes('{{') && line.includes('!input'));
    expect(offendingLines).toEqual([]);
  });

  it('gates on a positive, bounded delta (filters device counter resets and bogus jumps)', () => {
    const source = fs.readFileSync(blueprintPath, 'utf8');
    const doc = yaml.load(source, { schema: HA_SCHEMA });
    const condition = doc.conditions[0].value_template;
    expect(condition).toContain('delta > 0');
    expect(condition).toContain('delta < max_delta');
  });

  it('waits settle_delay before reading the visiting cat (the race-condition fix)', () => {
    const source = fs.readFileSync(blueprintPath, 'utf8');
    const doc = yaml.load(source, { schema: HA_SCHEMA });
    const delayStepIndex = doc.actions.findIndex((step) => step.delay);
    const catReadIndex = doc.actions.findIndex((step) => step.variables && step.variables.visiting_cat);
    expect(delayStepIndex).toBeGreaterThanOrEqual(0);
    expect(catReadIndex).toBeGreaterThan(delayStepIndex);
  });

  it('uses repeat: for_each over the cat mapping rather than a fixed number of choose branches', () => {
    const source = fs.readFileSync(blueprintPath, 'utf8');
    const doc = yaml.load(source, { schema: HA_SCHEMA });
    const repeatStep = doc.actions.find((step) => step.repeat);
    expect(repeatStep).toBeDefined();
    expect(repeatStep.repeat.for_each).toContain('cats');
  });

  it('runs in queued mode so back-to-back visits are not dropped', () => {
    const source = fs.readFileSync(blueprintPath, 'utf8');
    const doc = yaml.load(source, { schema: HA_SCHEMA });
    expect(doc.mode).toBe('queued');
  });
});
