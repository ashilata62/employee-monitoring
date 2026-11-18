/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            screens: {
                'xs': '420px',
            },
            spacing: {
                '4.5': '1.125rem',
            },
            fontFamily: {
                sans: ['"DM Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
                serif: ['"Playfair Display"', '"Cormorant Garamond"', 'Georgia', 'serif'],
                display: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
            },
            colors: {
                // Primary Accent: Muted Champagne Gold
                primary: {
                    50: '#FDFBF7',
                    100: '#F8F2E4',
                    200: '#EFE2C7',
                    300: '#DFC8A0',
                    400: '#CCA873',
                    500: '#B9955B', // Primary Accent (muted champagne gold)
                    600: '#A17D45',
                    700: '#846231',
                    800: '#654820',
                    900: '#483315',
                    950: '#281B09',
                },
                // Deep Olive Forest Green
                olive: {
                    50: '#F5F7F3',
                    100: '#E7ECE3',
                    200: '#D0DAC9',
                    300: '#B1C2A7',
                    400: '#8FA683',
                    500: '#6E8761',
                    600: '#526A47',
                    700: '#3C4536', // Sidebar Secondary
                    800: '#30382B', // Primary Sidebar: deep olive forest green
                    850: '#282F24',
                    900: '#1F241B',
                    950: '#151912',
                },
                // Warm Ivory & Neutral Scale (Mapped to slate so every component gracefully receives the warm luxury theme)
                slate: {
                    50: '#F5F1E9',   // Main Background: warm ivory cream
                    100: '#EEE8DD',  // Secondary Background: soft beige
                    150: '#E8E1D5',
                    200: '#E5DED2',  // Borders: warm soft borders
                    300: '#D6CDBC',
                    400: '#9E988A',  // Subtle secondary muted
                    500: '#777367',  // Secondary Text: muted warm grey
                    600: '#5C584E',
                    700: '#434038',
                    800: '#302E27',
                    900: '#29291F',  // Primary Text: dark charcoal / espresso
                    950: '#1A1A14',
                },
                // Warm Champagne & Gold
                gold: {
                    50: '#FDFBF7',
                    100: '#F8F2E4',
                    200: '#EFE2C7',
                    300: '#D3B98D',  // Secondary Accent: soft gold
                    400: '#C5A672',
                    500: '#B9955B',  // Primary Accent: champagne gold
                    600: '#9F7C43',
                    700: '#7F6030',
                    800: '#604620',
                    900: '#422F13',
                },
                // Reference Theme Semantic Tones
                sage: {
                    50: '#F4F7F4',
                    100: '#E5EDE5',
                    200: '#C8DAC8',
                    500: '#5E7D64',  // Success: muted sage green
                    600: '#4A6B53',
                    700: '#38533F',
                },
                terracotta: {
                    50: '#FAF3F2',
                    100: '#F5E4E2',
                    200: '#EAC3BE',
                    500: '#A84B4B',  // Danger: muted terracotta red
                    600: '#8E3B3B',
                    700: '#722C2C',
                },
                warmAmber: {
                    50: '#FDF8F0',
                    100: '#FAF0DE',
                    500: '#C98A3C',  // Warning: soft amber
                    600: '#B0742B',
                },
                card: {
                    DEFAULT: '#FBF9F5', // Card Background: off-white porcelain
                    dark: '#252B20',
                }
            },
            boxShadow: {
                'warm-xs': '0 1px 2px rgba(41, 41, 31, 0.03)',
                'warm-sm': '0 2px 4px rgba(41, 41, 31, 0.04), 0 1px 2px rgba(41, 41, 31, 0.02)',
                'warm-md': '0 4px 12px rgba(41, 41, 31, 0.05), 0 2px 4px rgba(41, 41, 31, 0.03)',
                'warm-lg': '0 10px 25px -3px rgba(41, 41, 31, 0.06), 0 4px 8px -2px rgba(41, 41, 31, 0.03)',
                'warm-xl': '0 20px 35px -5px rgba(41, 41, 31, 0.08), 0 8px 16px -4px rgba(41, 41, 31, 0.04)',
            },
            borderRadius: {
                'card': '1.25rem',
            }
        },
    },
    plugins: [],
}
