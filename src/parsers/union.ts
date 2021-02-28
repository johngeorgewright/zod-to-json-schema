import { ZodTypeDef } from 'zod';
import { ZodUnionDef } from 'zod/lib/src/types/union';
import { JsonSchema } from '../JsonSchema';
import { parseDef } from '../parseDef';

export function getUnion(def: ZodUnionDef, path: string[], visited: { def: ZodTypeDef; path: string[] }[]): JsonSchema {
  {
    const options = def.options.filter((x) => x._def.t !== 'undefined');
    if (options.length === 1) {
      return parseDef(options[0]._def, path, visited); // likely union with undefined, and thus probably optional object property
    }
    // This blocks tries to look ahead a bit to produce nicer looking schemas with type array instead of anyOf.
    if (options.every((x) => ['string', 'number', 'bigint', 'boolean', 'null'].includes(x._def.t) && (!x._def.checks || !x._def.checks.length))) {
      // all types in union are primitive, so might as well squash into {type: [...]}
      const types = options
        .reduce((types, option) => (types.includes(option._def.t) ? types : [...types, option._def.t]), [] as string[])
        .map((x) => (x === 'bigint' ? 'integer' : x));
      return {
        type: types.length > 1 ? types : types[0],
      };
    } else if (options.every((x) => x._def.t === 'literal')) {
      // all options literals
      const types = options.reduce((types, option) => {
        let type: string = typeof option._def.value;
        if (type === 'bigint') {
          type = 'integer';
        } else if (type === 'object' && option._def.value === null) {
          type = 'null';
        }
        return types.includes(type) ? types : [...types, type];
      }, []);
      if (types.every((x) => ['string', 'number', 'integer', 'boolean', 'null'].includes(x))) {
        // all the literals are primitive, as far as null can be considered primitive
        return {
          type: types.length > 1 ? types : types[0],
          enum: options.reduce((acc, x) => (acc.includes(x._def.value) ? acc : [...acc, x._def.value]), []),
        };
      }
    }
    return {
      // Fallback to verbose anyOf. This will always work schematically but it does get quite ugly at times.
      anyOf: options.map((x, i) => parseDef(x._def, [...path, i.toString()], visited)),
    };
  }
}
