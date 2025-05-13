// theme/useTeamTheme.ts

import { useContext } from 'react';
import TeamThemeContext from './TeamThemeContext';

const useTeamTheme = () => {
  return useContext(TeamThemeContext);
};

export default useTeamTheme;
