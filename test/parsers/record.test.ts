import { z } from "zod";
import { parseRecordDef } from "../../src/parsers/record";
import { References } from "../../src/References";

describe("records", () => {
  it("should be possible to describe a simple record", () => {
    const schema = z.record(z.number());

    const parsedSchema = parseRecordDef(schema._def, new References());
    const expectedSchema = {
      type: "object",
      additionalProperties: {
        type: "number",
      },
    };
    expect(parsedSchema).toStrictEqual(expectedSchema);
  });

  it("should be possible to describe a complex record with checks", () => {
    const schema = z.record(
      z.object({ foo: z.number().min(2) }).catchall(z.string().cuid())
    );

    const parsedSchema = parseRecordDef(schema._def, new References());
    const expectedSchema = {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          foo: {
            type: "number",
            minimum: 2,
          },
        },
        required: ["foo"],
        additionalProperties: {
          type: "string",
          pattern: "^c[^\\s-]{8,}$",
        },
      },
    };
    expect(parsedSchema).toStrictEqual(expectedSchema);
  });

  it("should be possible to describe a key schema", () => {
    const schema = z.record(z.string().uuid(), z.number());

    const parsedSchema = parseRecordDef(schema._def, new References());
    const expectedSchema = {
      type: "object",
      additionalProperties: {
        type: "number",
      },
      propertyNames: {
        format: "uuid",
      },
    };
    expect(parsedSchema).toStrictEqual(expectedSchema);
  });
});
