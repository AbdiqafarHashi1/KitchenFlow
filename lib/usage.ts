export type UsageInputs = {
  opening: number;
  purchases: number;
  closing: number;
  waste: number;
  averageUnitCost: number;
};

export function calculateUsage(inputs: UsageInputs) {
  const usage = inputs.opening + inputs.purchases - inputs.closing - inputs.waste;
  return {
    usage,
    usageCost: usage * inputs.averageUnitCost
  };
}
