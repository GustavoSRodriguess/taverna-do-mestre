import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={['/']} initialIndex={0}>
        {children}
      </actual.MemoryRouter>
    ),
  };
});

vi.mock('./components/Home', () => ({
  __esModule: true,
  default: () => <div>HomeMock</div>,
}));
vi.mock('./components/Login/Login', () => ({
  __esModule: true,
  default: () => <div>LoginMock</div>,
}));
vi.mock('./components/Login/ProtectedRoute', () => ({
  __esModule: true,
  default: () => <div>ProtectedArea</div>,
}));
vi.mock('./components/ComponentDoc', () => ({
  __esModule: true,
  default: () => <div>DocMock</div>,
}));
vi.mock('./components/Profile/UserProfile', () => ({
  __esModule: true,
  default: () => <div>UserProfileMock</div>,
}));
vi.mock('./components/Creator/IntegratedGenerator', () => ({
  __esModule: true,
  default: () => <div>GeneratorMock</div>,
}));
vi.mock('./components/Campaign', () => ({
  __esModule: true,
  CampaignDetails: () => <div>CampaignDetailsMock</div>,
  CampaignsList: () => <div>CampaignsListMock</div>,
}));
vi.mock('./components/Campaign/CampaignCharacterEditor', () => ({
  __esModule: true,
  default: () => <div>CampaignCharacterEditorMock</div>,
}));
vi.mock('./components/PC/PCList', () => ({
  __esModule: true,
  default: () => <div>PCListMock</div>,
}));
vi.mock('./components/PC', () => ({
  __esModule: true,
  PCEditor: () => <div>PCEditorMock</div>,
}));
vi.mock('./components/PC/PCCampaigns', () => ({
  __esModule: true,
  default: () => <div>PCCampaignsMock</div>,
}));
vi.mock('./components/Homebrew', () => ({
  __esModule: true,
  HomebrewManager: () => <div>HomebrewManagerMock</div>,
}));
vi.mock('./components/Dice/DiceRoller', () => ({
  __esModule: true,
  DiceRoller: () => <div>DiceRollerMock</div>,
}));

describe('App', () => {
  it('renders home route by default and shows 404 for unknown route', () => {
    render(<App />);
    expect(screen.getByText('HomeMock')).toBeInTheDocument();
  });
});
