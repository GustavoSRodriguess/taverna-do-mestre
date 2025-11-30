import React from 'react';
import { Badge } from '../../ui';
import { StatusType, GameAttributes } from '../../types/game';
import { getStatusConfig, ATTRIBUTE_SHORT_LABELS, formatModifier, calculateModifier } from '../../utils/gameUtils';

// ========================================
// STATUS BADGE COMPONENT
// ========================================
interface StatusBadgeProps {
    status: StatusType;
    type?: 'campaign' | 'character';
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    type = 'campaign',
    className = ''
}) => {
    const config = getStatusConfig(status, type);
    return <Badge text={config.text} variant={config.variant} className={className} />;
};

// ========================================
// ATTRIBUTE DISPLAY COMPONENT
// ========================================
interface AttributeDisplayProps {
    attributes: GameAttributes;
    layout?: 'grid' | 'inline' | 'circle';
    showModifiers?: boolean;
    className?: string;
    onAttributeChange?: (attr: keyof GameAttributes, value: number) => void;
    editable?: boolean;
}

export const AttributeDisplay: React.FC<AttributeDisplayProps> = ({
    attributes,
    layout = 'grid',
    showModifiers = true,
    className = '',
    onAttributeChange,
    editable = false
}) => {
    const renderAttribute = (key: keyof GameAttributes, value: number) => {
        const modifier = calculateModifier(value);
        const shortLabel = ATTRIBUTE_SHORT_LABELS[key];

        return (
            <div key={key} className="text-center p-2 bg-indigo-900/30 rounded">
                <div className="text-indigo-300 text-xs font-bold">{shortLabel}</div>
                {editable ? (
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => onAttributeChange?.(key, parseInt(e.target.value) || 0)}
                        className="w-full bg-transparent text-white text-center text-lg font-bold
                         border-none focus:outline-none focus:ring-1 focus:ring-purple-400 rounded"
                        min={1}
                        max={30}
                    />
                ) : (
                    <div className="text-white font-bold text-lg">{value}</div>
                )}
                {showModifiers && (
                    <div className="text-purple-300 text-sm">{formatModifier(modifier)}</div>
                )}
            </div>
        );
    };

    const gridClass = layout === 'grid' ? 'grid grid-cols-6 gap-2' :
        layout === 'inline' ? 'flex gap-4 flex-wrap' :
            'grid grid-cols-3 gap-4';

    return (
        <div className={`${gridClass} ${className}`}>
            {Object.entries(attributes).map(([key, value]) =>
                renderAttribute(key as keyof GameAttributes, value)
            )}
        </div>
    );
};

// ========================================
// HP BAR COMPONENT
// ========================================
interface HPBarProps {
    current: number;
    max: number;
    temporary?: number;
    className?: string;
    showNumbers?: boolean;
}

export const HPBar: React.FC<HPBarProps> = ({
    current,
    max,
    temporary = 0,
    className = '',
    showNumbers = true
}) => {
    const total = current + temporary;
    const percentage = Math.min((current / max) * 100, 100);
    const tempPercentage = temporary > 0 ? Math.min((temporary / max) * 100, 100) : 0;

    return (
        <div className={`space-y-2 ${className}`}>
            {showNumbers && (
                <div className="flex justify-between text-sm">
                    <span className="text-white font-bold">
                        {current}{temporary > 0 && ` (+${temporary})`}/{max} HP
                    </span>
                    <span className="text-indigo-300">{Math.round(percentage)}%</span>
                </div>
            )}

            <div className="bg-red-900 rounded-full h-3 overflow-hidden">
                <div className="flex h-full">
                    <div
                        className="bg-red-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                    />
                    {tempPercentage > 0 && (
                        <div
                            className="bg-blue-500 transition-all duration-300"
                            style={{ width: `${tempPercentage}%` }}
                        />
                    )}
                </div>
            </div>

            {temporary > 0 && (
                <div className="text-xs text-blue-300 text-center">
                    +{temporary} HP temporário
                </div>
            )}
        </div>
    );
};

// ========================================
// LEVEL BADGE COMPONENT
// ========================================
interface LevelBadgeProps {
    level: number;
    className?: string;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, className = '' }) => {
    const getColor = (level: number): string => {
        if (level <= 5) return 'text-green-400';
        if (level <= 10) return 'text-blue-400';
        if (level <= 15) return 'text-purple-400';
        return 'text-yellow-400';
    };

    return (
        <Badge
            text={`Nível ${level}`}
            variant="primary"
            className={`${getColor(level)} ${className}`}
        />
    );
};

// ========================================
// COMBAT STATS COMPONENT
// ========================================
interface CombatStatsProps {
    hp: number;
    currentHp?: number;
    ca: number;
    proficiencyBonus: number;
    temporaryHp?: number;
    className?: string;
}

export const CombatStats: React.FC<CombatStatsProps> = ({
    hp,
    currentHp,
    ca,
    proficiencyBonus,
    temporaryHp = 0,
    className = ''
}) => {
    const displayCurrentHp = currentHp ?? hp;

    return (
        <div className={`grid grid-cols-3 gap-2 ${className}`}>
            <div className="text-center p-2 bg-red-900/30 rounded">
                <div className="text-red-300 text-xs">HP</div>
                <div className="text-white font-bold">
                    {displayCurrentHp + temporaryHp}/{hp}
                </div>
            </div>

            <div className="text-center p-2 bg-blue-900/30 rounded">
                <div className="text-blue-300 text-xs">CA</div>
                <div className="text-white font-bold">{ca}</div>
            </div>

            <div className="text-center p-2 bg-purple-900/30 rounded">
                <div className="text-purple-300 text-xs">PROF</div>
                <div className="text-white font-bold">+{proficiencyBonus}</div>
            </div>
        </div>
    );
};

// ========================================
// LOADING STATES
// ========================================
export const CharacterCardSkeleton: React.FC = () => (
    <div className="animate-pulse bg-indigo-950/50 p-6 rounded-lg border border-indigo-800">
        <div className="h-4 bg-indigo-800 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-indigo-800 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-indigo-800 rounded"></div>
            ))}
        </div>
        <div className="grid grid-cols-6 gap-1">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-16 bg-indigo-800 rounded"></div>
            ))}
        </div>
    </div>
);

export const CampaignCardSkeleton: React.FC = () => (
    <div className="animate-pulse bg-indigo-950/50 p-6 rounded-lg border border-indigo-800">
        <div className="flex justify-between items-start mb-4">
            <div className="h-5 bg-indigo-800 rounded w-2/3"></div>
            <div className="h-6 bg-indigo-800 rounded w-16"></div>
        </div>
        <div className="h-3 bg-indigo-800 rounded w-full mb-2"></div>
        <div className="h-3 bg-indigo-800 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between">
                    <div className="h-3 bg-indigo-800 rounded w-1/3"></div>
                    <div className="h-3 bg-indigo-800 rounded w-1/4"></div>
                </div>
            ))}
        </div>
    </div>
);