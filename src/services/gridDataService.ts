/**
 * GRID Data Service - Cloud9 x JetBrains Hackathon
 * 
 * Comprehensive data fetching service for GRID Esports APIs:
 * - Central Data API: Static data (schedules, teams, players, tournaments)
 * - Series State API: Post-series states (winners, kills, player stats)
 * - File Download API: Event-by-event data for detailed analysis
 */

import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// API Endpoints (Cloud9 x JetBrains Hackathon)
const CENTRAL_DATA_URL = 'https://api-op.grid.gg/central-data/graphql';
const SERIES_STATE_URL = 'https://api-op.grid.gg/live-data-feed/series-state/graphql';
const FILE_DOWNLOAD_BASE = 'https://api.grid.gg/file-download';

// =====================================================
// TYPE DEFINITIONS - Based on GRID API Schema
// =====================================================

export interface GRIDPlayerRoundStats {
  roundNumber: number;
  kills: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  wasFirstKill: boolean;
  wasFirstDeath: boolean;
  equipmentValue: number;
}

export interface GRIDPlayer {
  id: string;
  name: string;
  kills: number;
  deaths: number;
  assists?: number;  // Optional - not always provided by API
  character?: { id: string; name: string } | string;
  role?: string;
  netWorth?: number;
  damageDealt?: number;
  damageTaken?: number;
  headshots?: number;
  firstKills?: number;
  firstDeaths?: number;
  clutchWins?: number;
  clutchAttempts?: number;
  clutchesWon?: number;
  clutchesLost?: number;
  multikills?: number;
  multiKills?: number;
  aces?: number;
  plants?: number;
  defuses?: number;
  // Economy metrics
  averageLoadoutValue?: number;
  economyRating?: number;
  // Round-by-round stats (if available)
  statsByRound?: GRIDPlayerRoundStats[];
}

export interface GRIDRound {
  number: number;
  outcome?: string;
  winningTeam?: { id: string; name: string };
  bomb?: {
    planted: boolean;
    defused: boolean;
    exploded: boolean;
  };
  roundType?: string;
}

export interface GRIDTeam {
  id: string;
  name: string;
  side?: string;
  score?: number;
  kills?: number;
  deaths?: number;
  won?: boolean;
  players: GRIDPlayer[];
  // Tactical metrics
  roundsWon?: number;
  roundsLost?: number;
  attackRoundsWon?: number;
  attackRoundsLost?: number;
  defenseRoundsWon?: number;
  defenseRoundsLost?: number;
  pistolRoundsWon?: number;
  pistolRoundsLost?: number;
  econRoundsWon?: number;
  forceRoundsWon?: number;
  fullBuyRoundsWon?: number;
}

export interface GRIDGame {
  id: string;
  number: number;
  sequenceNumber?: number;
  map?: { name: string } | string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  clock?: { currentSeconds: number };
  teams: GRIDTeam[];
  rounds?: GRIDRound[];
  winner?: GRIDTeam;
}

export interface GRIDSeriesState {
  id: string;
  started: boolean;
  finished: boolean;
  startedAt?: string;
  finishedAt?: string;
  teams: GRIDTeam[];
  games: GRIDGame[];
  format?: string;
}

export interface GRIDSeriesEvent {
  type: string;
  timestamp: string;
  sequenceNumber: number;
  gameNumber?: number;
  roundNumber?: number;
  data: Record<string, unknown>;
}

export interface GRIDTournament {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  logoUrl?: string;
}

export interface GRIDSeriesInfo {
  id: string;
  startTimeScheduled: string;
  type: string;
  tournament: GRIDTournament;
  teams: Array<{
    baseInfo: {
      id: string;
      name: string;
      logoUrl?: string;
    };
  }>;
  format?: {
    type?: string; 
  };
  title?: {
    id: number;
    name: string;
  };
}

// =====================================================
// APOLLO CLIENT SETUP
// =====================================================

const createAuthLink = () => setContext((_, { headers }) => {
  const apiKey = import.meta.env.VITE_GRID_API_KEY || '';
  return {
    headers: {
      ...headers,
      'x-api-key': apiKey,
    }
  };
});

// Central Data Client
const centralDataLink = createHttpLink({ uri: CENTRAL_DATA_URL });
export const centralDataClient = new ApolloClient({
  link: createAuthLink().concat(centralDataLink),
  cache: new InMemoryCache(),
});

// Series State Client
const seriesStateLink = createHttpLink({ uri: SERIES_STATE_URL });
export const seriesStateClient = new ApolloClient({
  link: createAuthLink().concat(seriesStateLink),
  cache: new InMemoryCache(),
});

// =====================================================
// GRAPHQL QUERIES - Central Data API
// =====================================================

export const GET_TITLES = gql`
  query Titles {
    titles {
      id
      name
    }
  }
`;

export const GET_TOURNAMENTS = gql`
  query Tournaments($titleId: String!) {
    tournaments(filter: { title: { id: { in: [$titleId] } } }) {
      totalCount
      edges {
        node {
          id
          name
          startDate
          endDate
        }
      }
    }
  }
`;

export const GET_SERIES_BY_TOURNAMENT = gql`
  query SeriesByTournament($tournamentId: Int!) {
    allSeries(
      filter: { tournament: { id: { in: $tournamentId }, includeChildren: { equals: true } } }
      orderBy: StartTimeScheduled
      orderDirection: DESC
      first: 100
    ) {
      totalCount
      edges {
        node {
          id
          startTimeScheduled
          type
          teams {
            baseInfo {
              id
              name
              logoUrl
            }
          }
          tournament {
            id
            name
          }
          title {
            id
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_ALL_LOL_SERIES = gql`
  query AllLoLSeries($first: Int, $after: String) {
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
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          startTimeScheduled
          type
          teams {
            baseInfo {
              id
              name
              logoUrl
            }
          }
          tournament {
            id
            name
          }
          title {
            id
            name
          }
        }
      }
    }
  }
`;

export const GET_ALL_VALORANT_SERIES = gql`
  query AllValorantSeries($first: Int, $after: String) {
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
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          startTimeScheduled
          type
          teams {
            baseInfo {
              id
              name
              logoUrl
            }
          }
          tournament {
            id
            name
          }
          title {
            id
            name
          }
        }
      }
    }
  }
`;

// =====================================================
// GRAPHQL QUERIES - Series State API
// =====================================================

export const GET_SERIES_STATE = gql`
  query SeriesState($seriesId: ID!) {
    seriesState(id: $seriesId) {
      id
      started
      finished
      format
      teams {
        id
        name
        won
        score
        players {
          id
          name
        }
      }
      games {
        id
        sequenceNumber
        map {
          name
        }
        teams {
          id
          name
          score
          won
          players {
            id
            name
            kills
            deaths
          }
        }
      }
    }
  }
`;

export const GET_DETAILED_SERIES_STATE = gql`
  query DetailedSeriesState($seriesId: ID!) {
    seriesState(id: $seriesId) {
      id
      started
      finished
      format
      teams {
        id
        name
        won
        score
        players {
          id
          name
        }
      }
      games {
        id
        sequenceNumber
        map {
          name
        }
        teams {
          id
          name
          score
          won
          side
          players {
            id
            name
            kills
            deaths
            character {
              id
              name
            }
          }
        }
      }
    }
  }
`;

// =====================================================
// DATA FETCHING FUNCTIONS
// =====================================================

/**
 * Fetch available game titles
 */
export async function fetchTitles(): Promise<Array<{ id: string; name: string }>> {
  try {
    const { data } = await centralDataClient.query({
      query: GET_TITLES,
      fetchPolicy: 'network-only',
    });
    return data.titles || [];
  } catch (error) {
    console.error('Error fetching titles:', error);
    return [];
  }
}

/**
 * Fetch tournaments for a specific game title
 */
export async function fetchTournaments(titleId: string): Promise<GRIDTournament[]> {
  try {
    const { data } = await centralDataClient.query({
      query: GET_TOURNAMENTS,
      variables: { titleId },
      fetchPolicy: 'network-only',
    });
    return data.tournaments.edges.map((e: { node: GRIDTournament }) => e.node);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }
}

/**
 * Fetch series for League of Legends
 */
export async function fetchLoLSeries(first: number = 50): Promise<GRIDSeriesInfo[]> {
  try {
    const { data } = await centralDataClient.query({
      query: GET_ALL_LOL_SERIES,
      variables: { first },
      fetchPolicy: 'network-only',
    });
    return data.allSeries.edges.map((e: { node: GRIDSeriesInfo }) => e.node);
  } catch (error) {
    console.error('Error fetching LoL series:', error);
    return [];
  }
}

/**
 * Fetch series for VALORANT
 */
export async function fetchValorantSeries(first: number = 50): Promise<GRIDSeriesInfo[]> {
  try {
    const { data } = await centralDataClient.query({
      query: GET_ALL_VALORANT_SERIES,
      variables: { first },
      fetchPolicy: 'network-only',
    });
    return data.allSeries.edges.map((e: { node: GRIDSeriesInfo }) => e.node);
  } catch (error) {
    console.error('Error fetching Valorant series:', error);
    return [];
  }
}

/**
 * Fetch detailed series state from Series State API
 */
export async function fetchSeriesState(seriesId: string): Promise<GRIDSeriesState | null> {
  try {
    const { data } = await seriesStateClient.query({
      query: GET_DETAILED_SERIES_STATE,
      variables: { seriesId },
      fetchPolicy: 'network-only',
    });
    return data.seriesState;
  } catch (error) {
    console.error('Error fetching series state:', error);
    return null;
  }
}

/**
 * Fetch basic series state
 */
export async function fetchBasicSeriesState(seriesId: string): Promise<GRIDSeriesState | null> {
  try {
    const { data } = await seriesStateClient.query({
      query: GET_SERIES_STATE,
      variables: { seriesId },
      fetchPolicy: 'network-only',
    });
    return data.seriesState;
  } catch (error) {
    console.error('Error fetching basic series state:', error);
    return null;
  }
}

// =====================================================
// FILE DOWNLOAD API FUNCTIONS
// =====================================================

interface FileDownloadItem {
  id: string;
  description: string;
  status: string;
  fileName: string;
  fullURL: string;
}

/**
 * List available files for download for a series
 */
export async function listSeriesFiles(seriesId: string): Promise<FileDownloadItem[]> {
  const apiKey = import.meta.env.VITE_GRID_API_KEY || '';
  
  try {
    const response = await fetch(`${FILE_DOWNLOAD_BASE}/list/${seriesId}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing series files:', error);
    return [];
  }
}

/**
 * Download events JSONL file for a series
 */
export async function downloadSeriesEvents(seriesId: string): Promise<GRIDSeriesEvent[]> {
  const apiKey = import.meta.env.VITE_GRID_API_KEY || '';
  
  try {
    const response = await fetch(`${FILE_DOWNLOAD_BASE}/events/grid/series/${seriesId}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // The response is a ZIP file containing JSONL
    // For now, we'll parse it as text if it's uncompressed
    const blob = await response.blob();
    
    // Check if it's a zip file
    if (blob.type === 'application/zip' || blob.type === 'application/x-zip-compressed') {
      // We'd need JSZip to decompress - for now return empty
      console.log('ZIP file detected - requires decompression');
      return [];
    }
    
    // Try to parse as JSONL
    const text = await blob.text();
    const lines = text.trim().split('\n');
    return lines.map(line => JSON.parse(line));
  } catch (error) {
    console.error('Error downloading series events:', error);
    return [];
  }
}

/**
 * Download end state JSON for a series
 */
export async function downloadSeriesEndState(seriesId: string): Promise<GRIDSeriesState | null> {
  const apiKey = import.meta.env.VITE_GRID_API_KEY || '';
  
  try {
    const response = await fetch(`${FILE_DOWNLOAD_BASE}/end-state/grid/series/${seriesId}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error downloading series end state:', error);
    return null;
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get game title by ID
 */
export const GAME_TITLES: Record<number, string> = {
  3: 'League of Legends',
  6: 'VALORANT',
  1: 'CS2',
  2: 'Dota 2',
};

/**
 * Hackathon available content
 * League of Legends: LCS, LEC, LCK, LPL
 * VALORANT: Americas
 */
export const HACKATHON_CONTENT = {
  LOL: ['LCS', 'LEC', 'LCK', 'LPL'],
  VALORANT: ['Americas'],
};
