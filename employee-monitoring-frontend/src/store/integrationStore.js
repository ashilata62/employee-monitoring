import { create } from 'zustand';
import integrationService from '../services/integrationService';
import { toast } from '../utils/toastManager';

// ── 52 Pre-Built Integration Metadata (Expanded Comprehensive Directory) ────
export const INTEGRATION_META = {
    // ── 1. Project Management & Tasks (10) ──────────────────────────────────
    jira: {
        name: 'Jira Software',
        description: 'Two-way sync: import Jira epics, sprints, and issues to track precise employee time.',
        logo: '◆',
        logoColor: '#0052cc',
        category: 'project-management',
        configType: 'project',
        requestAccess: false,
    },
    clickup: {
        name: 'ClickUp',
        description: 'Sync ClickUp workspaces, spaces, lists, and tasks with live desktop tracking.',
        logo: 'C',
        logoColor: '#7b68ee',
        category: 'project-management',
        configType: 'project',
        requestAccess: false,
    },
    asana: {
        name: 'Asana',
        description: 'Import Asana projects, sections, and tasks to monitor actual vs estimated duration.',
        logo: '⬤',
        logoColor: '#f06a6a',
        category: 'project-management',
        configType: 'project',
        requestAccess: false,
    },
    gitlab: {
        name: 'GitLab Issues',
        description: 'Synchronize GitLab repository issues and milestones with direct commit linking.',
        logo: '🦊',
        logoColor: '#fc6d26',
        category: 'project-management',
        configType: 'project',
        requestAccess: false,
    },
    github: {
        name: 'GitHub Projects',
        description: 'Import GitHub repository issues, project boards, and pull requests into tasks.',
        logo: '🐙',
        logoColor: '#24292e',
        category: 'project-management',
        configType: 'project',
        requestAccess: false,
    },
    azureDevops: {
        name: 'Azure DevOps Boards',
        description: 'Import Azure work items, user stories, and bugs for automated sprint time tracking.',
        logo: '❑',
        logoColor: '#0078d4',
        category: 'project-management',
        configType: 'project',
        requestAccess: false,
    },
    linear: {
        name: 'Linear',
        description: 'High-speed issue tracking sync with cycles, roadmaps, and engineer activity.',
        logo: '▲',
        logoColor: '#5e6ad2',
        category: 'project-management',
        configType: 'project',
        requestAccess: false,
    },
    trello: {
        name: 'Trello',
        description: 'Sync Trello boards, lists, and cards with employee task tracking sessions.',
        logo: '■',
        logoColor: '#0079bf',
        category: 'project-management',
        configType: 'project',
        requestAccess: false,
    },
    monday: {
        name: 'Monday.com',
        description: 'Import Monday Work OS items and pulse boards into employee workflow logs.',
        logo: 'M',
        logoColor: '#ff3d57',
        category: 'project-management',
        configType: 'project',
        requestAccess: false,
    },
    basecamp: {
        name: 'Basecamp',
        description: 'Sync Basecamp to-dos, projects, and check-ins for team productivity.',
        logo: '⛺',
        logoColor: '#28a745',
        category: 'project-management',
        configType: 'project',
        requestAccess: false,
    },

    // ── 2. Developer Tools & CI/CD (8) ──────────────────────────────────────
    gitlabCi: {
        name: 'GitLab CI/CD',
        description: 'Ingest pipeline build status, job durations, and runner deployment metrics.',
        logo: '🚀',
        logoColor: '#fc6d26',
        category: 'developer-tools',
        configType: 'hr',
        requestAccess: false,
    },
    githubActions: {
        name: 'GitHub Actions',
        description: 'Track workflow run times, automated test durations, and CI bottlenecks.',
        logo: '⚡',
        logoColor: '#2088ff',
        category: 'developer-tools',
        configType: 'hr',
        requestAccess: false,
    },
    bitbucket: {
        name: 'Bitbucket',
        description: 'Atlassian Bitbucket code repository push and pull request activity monitoring.',
        logo: '⍽',
        logoColor: '#205081',
        category: 'developer-tools',
        configType: 'hr',
        requestAccess: false,
    },
    sentry: {
        name: 'Sentry',
        description: 'Correlate application crashes and error frequency with developer active debug sessions.',
        logo: '⛊',
        logoColor: '#362d59',
        category: 'developer-tools',
        configType: 'hr',
        requestAccess: false,
    },
    datadog: {
        name: 'Datadog',
        description: 'Stream employee system performance metrics and infrastructure load to Datadog APM.',
        logo: '🐶',
        logoColor: '#632ca6',
        category: 'developer-tools',
        configType: 'warehouse',
        requestAccess: false,
    },
    docker: {
        name: 'Docker Hub',
        description: 'Track container build activity and developer containerized environment usage.',
        logo: '🐳',
        logoColor: '#0db7ed',
        category: 'developer-tools',
        configType: 'hr',
        requestAccess: false,
    },
    kubernetes: {
        name: 'Kubernetes',
        description: 'Ingest cluster pod lifecycle events and cloud workspace development environments.',
        logo: '☸',
        logoColor: '#326ce5',
        category: 'developer-tools',
        configType: 'warehouse',
        requestAccess: false,
    },
    awsCloudwatch: {
        name: 'AWS CloudWatch',
        description: 'Export real-time user activity telemetry and audit trails into Amazon CloudWatch.',
        logo: '☁',
        logoColor: '#ff9900',
        category: 'developer-tools',
        configType: 'warehouse',
        requestAccess: false,
    },

    // ── 3. Communication & Meetings (7) ─────────────────────────────────────
    slack: {
        name: 'Slack',
        description: 'Analyze communication volume, channel messaging, and focus time vs chat interruptions.',
        logo: '#',
        logoColor: '#4a154b',
        category: 'communication',
        configType: 'oauth',
        requestAccess: false,
    },
    msTeams: {
        name: 'Microsoft Teams',
        description: 'Sync Teams meeting duration, call presence status, and collaborative channel activity.',
        logo: 'T',
        logoColor: '#6264a7',
        category: 'communication',
        configType: 'oauth',
        requestAccess: false,
    },
    discord: {
        name: 'Discord Enterprise',
        description: 'Monitor engineering voice channel participation and developer collaboration servers.',
        logo: '👾',
        logoColor: '#5865f2',
        category: 'communication',
        configType: 'oauth',
        requestAccess: false,
    },
    zoom: {
        name: 'Zoom Video',
        description: 'Automatically import meeting schedules, call durations, and participant timestamps.',
        logo: '🎥',
        logoColor: '#2d8cff',
        category: 'communication',
        configType: 'oauth',
        requestAccess: false,
    },
    googleMeet: {
        name: 'Google Meet',
        description: 'Track Google Meet audio/video conferences directly from employee Google Calendars.',
        logo: '📹',
        logoColor: '#00897b',
        category: 'communication',
        configType: 'oauth',
        requestAccess: false,
    },
    webex: {
        name: 'Cisco Webex',
        description: 'Enterprise virtual meeting hours tracking and call collaboration analytics.',
        logo: '◎',
        logoColor: '#005073',
        category: 'communication',
        configType: 'oauth',
        requestAccess: false,
    },
    mattermost: {
        name: 'Mattermost',
        description: 'Self-hosted secure messaging sync for security-focused engineering teams.',
        logo: '💬',
        logoColor: '#0058cc',
        category: 'communication',
        configType: 'hr',
        requestAccess: false,
    },

    // ── 4. HRIS & Identity Management (10) ──────────────────────────────────
    bambooHR: {
        name: 'BambooHR',
        description: 'Synchronize employee directory, departments, job titles, and approved time-off requests.',
        logo: '🎋',
        logoColor: '#22c55e',
        category: 'hr-identity',
        configType: 'hr',
        requestAccess: false,
    },
    workday: {
        name: 'Workday Enterprise',
        description: 'Enterprise HRIS sync for worker profiles, organization hierarchy, and PTO balances.',
        logo: 'W',
        logoColor: '#f26f21',
        category: 'hr-identity',
        configType: 'hr',
        requestAccess: false,
    },
    rippling: {
        name: 'Rippling',
        description: 'All-in-one employee onboarding sync: auto-provision new staff accounts into tracking.',
        logo: 'R',
        logoColor: '#ffd100',
        category: 'hr-identity',
        configType: 'hr',
        requestAccess: false,
    },
    deel: {
        name: 'Deel',
        description: 'Global contractor and international full-time employee directory synchronization.',
        logo: 'D',
        logoColor: '#15357a',
        category: 'hr-identity',
        configType: 'hr',
        requestAccess: false,
    },
    remote: {
        name: 'Remote.com',
        description: 'Synchronize distributed international workforce records and compliance contracts.',
        logo: '🌍',
        logoColor: '#6c5ce7',
        category: 'hr-identity',
        configType: 'hr',
        requestAccess: false,
    },
    hibob: {
        name: 'HiBob',
        description: 'Sync employee information, teams, and lifecycle status from HiBob HR.',
        logo: 'b',
        logoColor: '#f43f5e',
        category: 'hr-identity',
        configType: 'hr',
        requestAccess: false,
    },
    personio: {
        name: 'Personio',
        description: 'European HR management sync: attendance records, work schedules, and leave data.',
        logo: 'P',
        logoColor: '#0f766e',
        category: 'hr-identity',
        configType: 'hr',
        requestAccess: false,
    },
    okta: {
        name: 'Okta Identity',
        description: 'SCIM user provisioning and Single Sign-On user authentication mapping.',
        logo: 'O',
        logoColor: '#007dc1',
        category: 'hr-identity',
        configType: 'oauth',
        requestAccess: false,
    },
    azureAd: {
        name: 'Microsoft Entra ID (Azure AD)',
        description: 'Sync Office 365 security groups, user identity roles, and SAML SSO assertions.',
        logo: '❖',
        logoColor: '#0078d4',
        category: 'hr-identity',
        configType: 'oauth',
        requestAccess: false,
    },
    onelogin: {
        name: 'OneLogin',
        description: 'Cloud identity and access management directory sync for enterprise access control.',
        logo: '1',
        logoColor: '#1f2937',
        category: 'hr-identity',
        configType: 'oauth',
        requestAccess: false,
    },

    // ── 5. Accounting & Payroll (9) ─────────────────────────────────────────
    gusto: {
        name: 'Gusto Embedded Payroll',
        description: 'Direct API sync: send verified work hours, overtime, and gross pay to Gusto pay runs.',
        logo: 'G',
        logoColor: '#f43f5e',
        category: 'payroll-accounting',
        configType: 'hr',
        requestAccess: false,
    },
    adp: {
        name: 'ADP Workforce Now',
        description: 'Direct enterprise payroll synchronization: submit approved time-card batches to ADP.',
        logo: 'ADP',
        logoColor: '#d0271d',
        category: 'payroll-accounting',
        configType: 'hr',
        requestAccess: false,
    },
    quickbooks: {
        name: 'QuickBooks Online',
        description: 'Sync tracked billable project hours, rates, and journal time activities with Intuit ledger.',
        logo: 'QB',
        logoColor: '#2ca01c',
        category: 'payroll-accounting',
        configType: 'warehouse',
        requestAccess: false,
    },
    xero: {
        name: 'Xero Cloud',
        description: 'Automated payroll timesheet sync and client billing export for Xero Accounting.',
        logo: 'X',
        logoColor: '#13b5ea',
        category: 'payroll-accounting',
        configType: 'warehouse',
        requestAccess: false,
    },
    freshbooks: {
        name: 'FreshBooks',
        description: 'Export tracked project time logs directly into client invoices and billing slips.',
        logo: 'F',
        logoColor: '#0075dd',
        category: 'payroll-accounting',
        configType: 'hr',
        requestAccess: false,
    },
    netsuite: {
        name: 'Oracle NetSuite',
        description: 'Enterprise ERP sync: export labor cost allocations and project utilization journals.',
        logo: 'N',
        logoColor: '#607274',
        category: 'payroll-accounting',
        configType: 'warehouse',
        requestAccess: false,
    },
    sage: {
        name: 'Sage Accounting',
        description: 'Sync payroll wage journals and employee hourly work time into Sage Business Cloud.',
        logo: 'S',
        logoColor: '#00dc00',
        category: 'payroll-accounting',
        configType: 'hr',
        requestAccess: false,
    },
    zohoBooks: {
        name: 'Zoho Books',
        description: 'Sync staff timesheets and billable project hours directly to Zoho client invoices.',
        logo: 'Z',
        logoColor: '#d32f2f',
        category: 'payroll-accounting',
        configType: 'hr',
        requestAccess: false,
    },
    paychex: {
        name: 'Paychex Flex',
        description: 'Export payroll-ready gross wages, hourly rates, and attendance time to Paychex.',
        logo: 'Px',
        logoColor: '#004b87',
        category: 'payroll-accounting',
        configType: 'hr',
        requestAccess: false,
    },

    // ── 6. Productivity, Design & Docs (8) ──────────────────────────────────
    googleWorkspace: {
        name: 'Google Workspace',
        description: 'Analyze Google Docs, Sheets, and Drive activity with employee calendar sync.',
        logo: 'G',
        logoColor: '#ea4335',
        category: 'productivity-docs',
        configType: 'oauth',
        requestAccess: false,
    },
    ms365: {
        name: 'Microsoft 365',
        description: 'Monitor Excel, Word, PowerPoint, and SharePoint file editing hours and focus time.',
        logo: '⊞',
        logoColor: '#d83b01',
        category: 'productivity-docs',
        configType: 'oauth',
        requestAccess: false,
    },
    notion: {
        name: 'Notion',
        description: 'Sync team documentation pages, sprint roadmaps, and knowledge base editing logs.',
        logo: 'N',
        logoColor: '#000000',
        category: 'productivity-docs',
        configType: 'hr',
        requestAccess: false,
    },
    coda: {
        name: 'Coda',
        description: 'Interactive doc workspace sync: track time spent on shared project docs and formulas.',
        logo: 'C',
        logoColor: '#f36',
        category: 'productivity-docs',
        configType: 'hr',
        requestAccess: false,
    },
    confluence: {
        name: 'Confluence',
        description: 'Atlassian wiki documentation time tracking and technical specification authoring logs.',
        logo: 'C',
        logoColor: '#0052cc',
        category: 'productivity-docs',
        configType: 'project',
        requestAccess: false,
    },
    figma: {
        name: 'Figma & FigJam',
        description: 'Track design sprint active design canvas time, wireframing, and prototype review sessions.',
        logo: 'F',
        logoColor: '#a259ff',
        category: 'productivity-docs',
        configType: 'hr',
        requestAccess: false,
    },
    miro: {
        name: 'Miro Whiteboards',
        description: 'Monitor visual brainstorming, mind-mapping, and team retrospective workshop hours.',
        logo: 'M',
        logoColor: '#ffd02f',
        category: 'productivity-docs',
        configType: 'hr',
        requestAccess: false,
    },
    airtable: {
        name: 'Airtable',
        description: 'Connect Airtable relational bases and record time allocations against base tables.',
        logo: 'A',
        logoColor: '#fcb400',
        category: 'productivity-docs',
        configType: 'hr',
        requestAccess: false,
    },
};

// ── 6 Category Tabs ────────────────────────────────────────────────────────
export const INTEGRATION_TABS = [
    {
        id: 'project-management',
        label: 'Project Management',
        route: '/settings/integrations/project-management',
        subtitle: 'Two-way task and issue sync with leading sprint tracking platforms.',
        keys: ['jira', 'clickup', 'asana', 'gitlab', 'github', 'azureDevops', 'linear', 'trello', 'monday', 'basecamp'],
    },
    {
        id: 'developer-tools',
        label: 'Developer Tools & CI/CD',
        route: '/settings/integrations/developer-tools',
        subtitle: 'Monitor software build pipelines, code repositories, error telemetry, and cloud infrastructure.',
        keys: ['gitlabCi', 'githubActions', 'bitbucket', 'sentry', 'datadog', 'docker', 'kubernetes', 'awsCloudwatch'],
    },
    {
        id: 'communication',
        label: 'Communication & Calls',
        route: '/settings/integrations/communication',
        subtitle: 'Measure meeting durations, team messaging volume, and collaborative focus hours.',
        keys: ['slack', 'msTeams', 'discord', 'zoom', 'googleMeet', 'webex', 'mattermost'],
    },
    {
        id: 'hr-identity',
        label: 'HRIS & Identity',
        route: '/settings/integrations/hr-identity',
        subtitle: 'Automated staff onboarding, organizational chart synchronization, and SSO access management.',
        keys: ['bambooHR', 'workday', 'rippling', 'deel', 'remote', 'hibob', 'personio', 'okta', 'azureAd', 'onelogin'],
    },
    {
        id: 'payroll-accounting',
        label: 'Payroll & Accounting',
        route: '/settings/integrations/payroll-accounting',
        subtitle: 'Direct cloud payroll synchronization: submit work hours, overtime, and gross wages.',
        keys: ['gusto', 'adp', 'quickbooks', 'xero', 'freshbooks', 'netsuite', 'sage', 'zohoBooks', 'paychex'],
    },
    {
        id: 'productivity-docs',
        label: 'Productivity & Docs',
        route: '/settings/integrations/productivity-docs',
        subtitle: 'Track document creation, design canvas hours, and shared workspace activity.',
        keys: ['googleWorkspace', 'ms365', 'notion', 'coda', 'confluence', 'figma', 'miro', 'airtable'],
    },
];

// ── Default State Builder ──────────────────────────────────────────────────
const allKeys = Object.keys(INTEGRATION_META);
const DEFAULT_INTEGRATIONS = Object.fromEntries(allKeys.map(k => [k, { connected: false, config: {} }]));

// ── Zustand Store ──────────────────────────────────────────────────────────
export const useIntegrationStore = create((set, get) => ({
    integrations: DEFAULT_INTEGRATIONS,
    loading: false,
    error: null,

    fetchIntegrations: async () => {
        set({ loading: true, error: null });
        try {
            const data = await integrationService.getIntegrations();
            const mapped = {};
            if (Array.isArray(data)) {
                data.forEach(item => {
                    mapped[item.integrationId] = {
                        connected: item.connected,
                        config: item.config || {}
                    };
                });
            } else if (typeof data === 'object') {
                Object.assign(mapped, data);
            }
            set({
                integrations: { ...DEFAULT_INTEGRATIONS, ...mapped },
                loading: false
            });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    connectIntegration: async (id, config = {}) => {
        set({ loading: true });
        try {
            await integrationService.configureIntegration(id, config);
            set((state) => ({
                integrations: {
                    ...state.integrations,
                    [id]: { connected: true, config },
                },
                loading: false
            }));
            toast.success(`${INTEGRATION_META[id]?.name || id} connected successfully!`);
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    disconnectIntegration: async (id) => {
        set({ loading: true });
        try {
            await integrationService.disconnectIntegration(id);
            set((state) => ({
                integrations: {
                    ...state.integrations,
                    [id]: { connected: false, config: {} },
                },
                loading: false
            }));
            toast.success(`${INTEGRATION_META[id]?.name || id} disconnected!`);
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateIntegrationConfig: async (id, config) => {
        return get().connectIntegration(id, config);
    },
}));
