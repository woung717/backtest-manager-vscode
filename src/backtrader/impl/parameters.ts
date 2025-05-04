import { BacktestConfig } from './types';

export interface StrategyParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    defaultValue?: any;
    description?: string;
    required?: boolean;
    validation?: (value: any) => boolean | string;
}

export interface StrategyDefinition {
    name: string;
    description: string;
    parameters: Record<string, StrategyParameter>;
}

/**
 * Strategy parameter validation
 */
export function validateStrategyParameters(
    strategy: StrategyDefinition,
    params: Record<string, any>
): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required parameter check
    for (const [name, param] of Object.entries(strategy.parameters)) {
        if (param.required && !(name in params)) {
            errors.push(`Required parameter '${name}' is missing.`);
            continue;
        }

        if (name in params) {
            const value = params[name];

            // Type check
            switch (param.type) {
                case 'number':
                    if (typeof value !== 'number') {
                        errors.push(`Parameter '${name}' must be a number.`);
                    }
                    break;
                case 'boolean':
                    if (typeof value !== 'boolean') {
                        errors.push(`Parameter '${name}' must be a boolean.`);
                    }
                    break;
                case 'array':
                    if (!Array.isArray(value)) {
                        errors.push(`Parameter '${name}' must be an array.`);
                    }
                    break;
                case 'string':
                    if (typeof value !== 'string') {
                        errors.push(`Parameter '${name}' must be a string.`);
                    }
                    break;
            }

            // Custom validation
            if (param.validation) {
                const validationResult = param.validation(value);
                if (typeof validationResult === 'string') {
                    errors.push(validationResult);
                } else if (!validationResult) {
                    errors.push(`Parameter '${name}' is invalid.`);
                }
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Converts strategy parameters to Python code
 */
export function convertToPythonParams(params: Record<string, any>): string {
    return Object.entries(params)
        .map(([key, value]) => {
            if (typeof value === 'string') {
                return `${key}='${value}'`;
            } else if (Array.isArray(value)) {
                return `${key}=[${value.join(', ')}]`;
            } else if (typeof value === 'object' && value !== null) {
                return `${key}=${JSON.stringify(value)}`;
            }
            return `${key}=${value}`;
        })
        .join(', ');
}

/**
 * Create default configuration with parameter values
 */
export function createDefaultConfig(strategy: StrategyDefinition): Partial<BacktestConfig> {
    const strategyParams: Record<string, any> = {};

    for (const [name, param] of Object.entries(strategy.parameters)) {
        if (param.defaultValue !== undefined) {
            strategyParams[name] = param.defaultValue;
        }
    }

    return {
        strategy: strategy.name,
        strategyParams,
        plotEnabled: false,
        logLevel: 'info'
    };
}