import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Cloud9 x JetBrains Hackathon API endpoints
const GRID_API_URL = 'https://api-op.grid.gg/central-data/graphql';

// Game Title IDs
export const GAME_TITLE_IDS = {
  VALORANT: 6,
  LOL: 3,
  CSGO: 1,
  DOTA2: 2,
  RAINBOW_SIX: 25,
  ROCKET_LEAGUE: 14,
} as const;

// Series Types
export type SeriesType = 'ESPORTS' | 'SCRIM' | 'COMPETITIVE';

// Service Levels
export type ServiceLevel = 'FULL' | 'PARTIAL' | 'NONE';

const httpLink = createHttpLink({
  uri: GRID_API_URL,
});

// Debug: Log the API key status on load
const apiKey = import.meta.env.VITE_GRID_API_KEY;
console.log('🔑 GRID API Key configured:', apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING');

const authLink = setContext((_, { headers }) => {
  const apiKey = import.meta.env.VITE_GRID_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ GRID API Key is missing. Please add VITE_GRID_API_KEY to your .env file');
  }
  
  // GRID API uses x-api-key header for authentication
  return {
    headers: {
      ...headers,
      'x-api-key': apiKey || '',
    }
  }
});

export const gridClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

// =============================================
// ALL SERIES QUERY - Based on GRID documentation
// The filter must be inline, not using variables for nested objects
// =============================================
export const GET_ALL_SERIES_VALORANT = gql`
  query GetAllSeriesValorant($first: Int, $after: String) {
    allSeries(
      first: $first
      after: $after
      filter: {
        titleId: 6
        types: [ESPORTS]
      }
      orderBy: StartTimeScheduled
      orderDirection: DESC
    ) {
      totalCount
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          type
          startTimeScheduled
          title {
            id
            name
          }
          tournament {
            id
            name
          }
          teams {
            baseInfo {
              id
              name
              logoUrl
            }
          }
        }
      }
    }
  }
`;

export const GET_ALL_SERIES_CSGO = gql`
  query GetAllSeriesCsgo($first: Int, $after: String) {
    allSeries(
      first: $first
      after: $after
      filter: {
        titleId: 1
        types: [ESPORTS]
      }
      orderBy: StartTimeScheduled
      orderDirection: DESC
    ) {
      totalCount
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          type
          startTimeScheduled
          title {
            id
            name
          }
          tournament {
            id
            name
          }
          teams {
            baseInfo {
              id
              name
              logoUrl
            }
          }
        }
      }
    }
  }
`;

export const GET_ALL_SERIES_LOL = gql`
  query GetAllSeriesLol($first: Int, $after: String) {
    allSeries(
      first: $first
      after: $after
      filter: {
        titleId: 3
        types: [ESPORTS]
      }
      orderBy: StartTimeScheduled
      orderDirection: DESC
    ) {
      totalCount
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          type
          startTimeScheduled
          title {
            id
            name
          }
          tournament {
            id
            name
          }
          teams {
            baseInfo {
              id
              name
              logoUrl
            }
          }
        }
      }
    }
  }
`;

export const GET_ALL_SERIES_DOTA2 = gql`
  query GetAllSeriesDota2($first: Int, $after: String) {
    allSeries(
      first: $first
      after: $after
      filter: {
        titleId: 2
        types: [ESPORTS]
      }
      orderBy: StartTimeScheduled
      orderDirection: DESC
    ) {
      totalCount
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          type
          startTimeScheduled
          title {
            id
            name
          }
          tournament {
            id
            name
          }
          teams {
            baseInfo {
              id
              name
              logoUrl
            }
          }
        }
      }
    }
  }
`;

// Map title IDs to queries
const SERIES_QUERIES: Record<number, ReturnType<typeof gql>> = {
  [GAME_TITLE_IDS.VALORANT]: GET_ALL_SERIES_VALORANT,
  [GAME_TITLE_IDS.CSGO]: GET_ALL_SERIES_CSGO,
  [GAME_TITLE_IDS.LOL]: GET_ALL_SERIES_LOL,
  [GAME_TITLE_IDS.DOTA2]: GET_ALL_SERIES_DOTA2,
};

// Series State API queries
export const GET_SERIES_STATE = gql`
  query GetSeriesState($seriesId: ID!) {
    series(id: $seriesId) {
      id
      state {
        score {
          home
          away
        }
        phase
        isPaused
      }
    }
  }
`;

// Central Data Feed queries
export const GET_TOURNAMENTS = gql`
  query GetTournaments($limit: Int, $offset: Int) {
    tournaments(limit: $limit, offset: $offset) {
      id
      title
      game
      startDate
      endDate
      organizer
      location
    }
  }
`;

export const GET_TOURNAMENT_DETAILS = gql`
  query GetTournamentDetails($tournamentId: ID!) {
    tournament(id: $tournamentId) {
      id
      title
      game
      startDate
      endDate
      organizer
      location
      teams {
        id
        name
        country
        logo
      }
      matches {
        id
        date
        homeTeam {
          id
          name
        }
        awayTeam {
          id
          name
        }
        score {
          home
          away
        }
      }
    }
  }
`;

export const GET_TEAM_ROSTER = gql`
  query GetTeamRoster($teamId: ID!) {
    team(id: $teamId) {
      id
      name
      country
      logo
      roster {
        playerId
        inGameName
        firstName
        lastName
        role
        nationality
      }
    }
  }
`;

export const GET_PLAYER_STATS = gql`
  query GetPlayerStats($playerId: ID!, $tournamentId: ID) {
    player(id: $playerId) {
      id
      inGameName
      firstName
      lastName
      nationality
      stats(tournamentId: $tournamentId) {
        kills
        deaths
        assists
        kdRatio
        headshotPercentage
        damagePerRound
        rating
      }
    }
  }
`;

export const GET_SERIES_DETAILS = gql`
  query GetSeriesDetails($seriesId: ID!) {
    series(id: $seriesId) {
      id
      startTime
      tournament {
        id
        title
      }
      teams {
        id
        name
        logo
      }
      games {
        id
        sequenceNumber
        map
        score {
          home
          away
        }
        duration
        winner
      }
    }
  }
`;

export const GET_MATCH_SCHEDULE = gql`
  query GetMatchSchedule($tournamentId: ID!, $date: String) {
    tournament(id: $tournamentId) {
      id
      matches(date: $date) {
        id
        date
        homeTeam {
          id
          name
          logo
        }
        awayTeam {
          id
          name
          logo
        }
        status
      }
    }
  }
`;

export const GET_LIVE_MATCHES = gql`
  query GetLiveMatches($game: String) {
    liveMatches(game: $game) {
      id
      homeTeam {
        id
        name
        logo
      }
      awayTeam {
        id
        name
        logo
      }
      score {
        home
        away
      }
      currentMap
      tournament {
        id
        title
      }
    }
  }
`;

// Historical data for baseline analysis
export const GET_HISTORICAL_PERFORMANCE = gql`
  query GetHistoricalPerformance($teamId: ID!, $limit: Int) {
    team(id: $teamId) {
      id
      name
      recentMatches(limit: $limit) {
        id
        date
        opponent {
          id
          name
        }
        score {
          team
          opponent
        }
        result
        map
      }
      statistics {
        winRate
        avgRoundsWon
        avgRoundsLost
        mapWinRates {
          map
          winRate
          played
        }
      }
    }
  }
`;

// Helper function to fetch series state
export async function fetchSeriesState(seriesId: string) {
  try {
    const { data } = await gridClient.query({
      query: GET_SERIES_STATE,
      variables: { seriesId },
      fetchPolicy: 'network-only' // Always fetch fresh data
    });
    return data.series;
  } catch (error) {
    console.error('Error fetching series state:', error);
    return null;
  }
}

// Helper function to fetch live matches
export async function fetchLiveMatches(game: string = 'csgo') {
  try {
    const { data } = await gridClient.query({
      query: GET_LIVE_MATCHES,
      variables: { game },
      fetchPolicy: 'network-only'
    });
    return data.liveMatches;
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return [];
  }
}

// Helper function to fetch team roster
export async function fetchTeamRoster(teamId: string) {
  try {
    const { data } = await gridClient.query({
      query: GET_TEAM_ROSTER,
      variables: { teamId }
    });
    return data.team.roster;
  } catch (error) {
    console.error('Error fetching team roster:', error);
    return [];
  }
}

// =============================================
// ALL SERIES HELPER FUNCTIONS
// =============================================

export interface FetchSeriesOptions {
  titleId?: number;
  types?: SeriesType[];
  startTimeGte?: string;
  startTimeLte?: string;
  productName?: string;
  serviceLevel?: ServiceLevel;
  first?: number;
  after?: string;
  orderBy?: 'StartTimeScheduled' | 'Id';
  orderDirection?: 'ASC' | 'DESC';
}

export interface SeriesNode {
  id: string;
  type: string;
  startTimeScheduled: string;
  title: {
    id: number;
    name: string;
  };
  tournament: {
    id: string;
    name: string;
  };
  teams: Array<{
    baseInfo: {
      id: string;
      name: string;
      logoUrl: string;
    };
  }>;
  format?: {
    type?: string;
  };
}

export interface SeriesListResponse {
  totalCount: number;
  pageInfo: {
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    startCursor: string;
    endCursor: string;
  };
  series: SeriesNode[];
}

/**
 * Fetches a list of series from the GRID Central Data API
 * Uses game-specific queries with hardcoded filters (per GRID API requirements)
 */
export async function fetchAllSeries(options: FetchSeriesOptions = {}): Promise<SeriesListResponse> {
  const {
    titleId = GAME_TITLE_IDS.VALORANT,
    first = 50,
    after,
  } = options;

  try {
    // Select the appropriate query based on game
    const query = SERIES_QUERIES[titleId] || GET_ALL_SERIES_VALORANT;
    
    const { data } = await gridClient.query({
      query,
      variables: {
        first,
        after,
      },
      fetchPolicy: 'network-only',
    });

    const allSeries = data.allSeries;
    return {
      totalCount: allSeries.totalCount,
      pageInfo: allSeries.pageInfo,
      series: allSeries.edges.map((edge: { node: SeriesNode }) => edge.node),
    };
  } catch (error) {
    console.error('Error fetching all series:', error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return {
      totalCount: 0,
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: '',
        endCursor: '',
      },
      series: [],
    };
  }
}

/**
 * Fetches recent esports series for a specific game
 */
export async function fetchRecentSeries(titleId: number = GAME_TITLE_IDS.VALORANT, limit: number = 50) {
  // Select the appropriate query based on game
  const query = SERIES_QUERIES[titleId] || GET_ALL_SERIES_VALORANT;
  
  console.log('📡 Fetching series with query for titleId:', titleId);
  console.log('🔑 API Key present:', !!import.meta.env.VITE_GRID_API_KEY);
  
  try {
    const { data, errors } = await gridClient.query({
      query,
      variables: { first: limit },
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    });

    if (errors && errors.length > 0) {
      console.error('❌ GraphQL errors:', errors);
      throw new Error(errors.map(e => e.message).join(', '));
    }

    if (!data || !data.allSeries) {
      console.error('❌ No data returned from API');
      throw new Error('No data returned from GRID API');
    }

    console.log('✅ GRID API Response - Total series:', data.allSeries.totalCount);

    return {
      totalCount: data.allSeries.totalCount,
      hasNextPage: data.allSeries.pageInfo.hasNextPage,
      endCursor: data.allSeries.pageInfo.endCursor,
      series: data.allSeries.edges.map((edge: { node: SeriesNode }) => edge.node),
    };
  } catch (error) {
    console.error('❌ fetchRecentSeries error:', error);
    throw error;
  }
}

/**
 * Fetches all pages of series matching the given filters
 * Automatically handles pagination
 */
export async function fetchAllSeriesPaginated(
  options: Omit<FetchSeriesOptions, 'after'>,
  maxPages: number = 10
): Promise<SeriesNode[]> {
  const allSeries: SeriesNode[] = [];
  let cursor: string | undefined;
  let pageCount = 0;

  while (pageCount < maxPages) {
    const result = await fetchAllSeries({ ...options, after: cursor });
    allSeries.push(...result.series);

    if (!result.pageInfo.hasNextPage) {
      break;
    }

    cursor = result.pageInfo.endCursor;
    pageCount++;
  }

  return allSeries;
}

/**
 * Fetches series with full live data feed available
 */
export async function fetchSeriesWithLiveData(titleId: number = GAME_TITLE_IDS.VALORANT) {
  return fetchAllSeries({
    titleId,
    types: ['ESPORTS'],
    productName: 'liveDataFeed',
    serviceLevel: 'FULL',
    first: 50,
  });
}

/**
 * Fetches series within a specific date range
 */
export async function fetchSeriesByDateRange(
  titleId: number,
  startDate: string,
  endDate: string
) {
  return fetchAllSeries({
    titleId,
    types: ['ESPORTS'],
    startTimeGte: startDate,
    startTimeLte: endDate,
    first: 50,
  });
}
