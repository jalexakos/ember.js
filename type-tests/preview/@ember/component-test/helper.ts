import { BadType, DefaultPositional, EmptyObject } from '@ember/component/-private/signature-utils';
import Helper, {
  ExpandSignature,
  FunctionBasedHelper,
  FunctionBasedHelperInstance,
  helper,
} from '@ember/component/helper';
import { expectTypeOf } from 'expect-type';

class DeprecatedSignatureForm extends Helper<{
  PositionalArgs: [offset: Date];
  Return: Date;
}> {
  timer?: ReturnType<typeof setInterval> | undefined;
  now = new Date();
  init() {
    super.init();
    this.timer = setInterval(() => {
      this.set('now', new Date());
      this.recompute();
    }, 100);
  }
  compute([offset]: [Date]): Date {
    return new Date(this.now.getTime() + offset.getTime());
  }
  willDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}

interface DemoSig {
  Args: {
    Named: {
      name: string;
      age: number;
    };
    Positional: [i18nizer: (s: string) => string];
  };
  Return: string;
}

function testMissingSignature({ Args, Return }: ExpandSignature<unknown>) {
  expectTypeOf(Args.Named).toEqualTypeOf<BadType<'This helper is missing a signature'>>();

  expectTypeOf(Args.Positional).toEqualTypeOf<unknown[]>();
  expectTypeOf(Return).toBeUnknown();
}

class SignatureForm extends Helper<DemoSig> {
  compute(
    [i18nizer]: [i18nizer: (s: string) => string],
    { name, age }: { name: string; age: number }
  ): string {
    return i18nizer(`${name} is ${age} years old`);
  }
}

class NoSignatureForm extends Helper {
  compute(
    [i18nizer]: [i18nizer: (s: string) => string],
    { name, age }: { name: string; age: number }
  ): string {
    return i18nizer(`${name} is ${age} years old`);
  }
}

class BadPosSigForm extends Helper<DemoSig> {
  compute(
    // @ts-expect-error
    [i18nizer, extra]: [i18nizer: (s: string) => string],
    { name, age }: { name: string; age: number }
  ): string {
    return i18nizer(`${name} is ${age} years old`);
  }
}

class BadNamedSigForm extends Helper<DemoSig> {
  compute(
    [i18nizer]: [i18nizer: (s: string) => string],
    // @ts-expect-error
    { name, age, potato }: { name: string; age: number }
  ): string {
    return i18nizer(`${name} is ${age} years old`);
  }
}

class BadReturnForm extends Helper<DemoSig> {
  compute(
    [i18nizer]: [i18nizer: (s: string) => string],
    { name, age }: { name: string; age: number }
  ): string {
    // @ts-expect-error
    return Boolean(i18nizer(`${name} is ${age} years old`));
  }
}

const inferenceOnPositional = helper(function add([a, b]: [number, number]) {
  return a + b;
});

expectTypeOf(inferenceOnPositional).toEqualTypeOf<
  FunctionBasedHelper<{
    Args: { Positional: [number, number]; Named: EmptyObject };
    Return: number;
  }>
>();

const coolHelper = helper((_, named) => {
  expectTypeOf(named).toEqualTypeOf<EmptyObject>();
});

const typeInferenceOnNamed = helper((_, { cool }: { cool: boolean }) => {
  expectTypeOf(cool).toBeBoolean();

  return cool ? 123 : 'neat';
});
expectTypeOf(typeInferenceOnNamed).toEqualTypeOf<
  FunctionBasedHelper<{
    Args: { Positional: DefaultPositional; Named: { cool: boolean } };
    Return: 123 | 'neat';
  }>
>();

const dasherizeHelper = helper(function dasherize(
  [str]: [string],
  { delim = '-' }: { delim?: string }
) {
  return str.split(/[\s\n_.]+/g).join(delim);
});
expectTypeOf(dasherizeHelper).toEqualTypeOf<
  FunctionBasedHelper<{ Args: { Positional: [string]; Named: { delim?: string } }; Return: string }>
>();

const signatureForm = helper<DemoSig>(([i18nizer], { name, age }) =>
  i18nizer(`${name} is ${age} years old`)
);

// @ts-expect-error
const badPosArgsSig = helper<DemoSig>(([i18nizer, extra], { name, age }) =>
  i18nizer(`${name} is ${age} years old`)
);

// @ts-expect-error
const badNamedArgsSig = helper<DemoSig>(([i18nizer], { name, age, potato }) =>
  i18nizer(`${name} is ${age} years old`)
);

const badReturnSig = helper<DemoSig>(([i18nizer], { name, age }) =>
  // @ts-expect-error
  Boolean(i18nizer(`${name} is ${age} years old`))
);

const greet = helper(([name]: [string]) => `Hello, ${name}`);

// @ts-expect-error
new greet();

// @ts-expect-error
class Subgreet extends greet {}

const pair = helper(<T>([item]: [T]): [T, T] => [item, item]);
expectTypeOf(pair).toEqualTypeOf<
  abstract new <T>() => FunctionBasedHelperInstance<{
    Args: { Positional: [T]; Named: EmptyObject };
    Return: [T, T];
  }>
>();
