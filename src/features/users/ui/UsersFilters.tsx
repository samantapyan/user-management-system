import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import type { UsersFiltersQueryPatch, UsersQuery } from '../model/types';

const SEARCH_DEBOUNCE_MS = 300;

const ALL_CITIES = '';

type UsersFiltersProps = {
  query: UsersQuery;
  cities: string[];
  /** The cities request failed, so the dropdown is empty for a reason worth saying. */
  citiesFailed: boolean;
  onQueryChange: (patch: UsersFiltersQueryPatch) => void;
};

const rootSx = { mb: 2 };
const searchSx = {
  flex: 1,
  // The custom clear button below is the only one, on every browser.
  '& input[type="search"]::-webkit-search-cancel-button': { display: 'none' },
};
const citySx = { minWidth: { xs: '100%', sm: 220 } };

export function UsersFilters({
  query,
  cities,
  citiesFailed,
  onQueryChange,
}: UsersFiltersProps) {
  /* The field owns its value so typing is instant. Only the write to the URL is
     debounced, because a text box that lags behind the keyboard is worse than anything
     debouncing fixes. */
  const [text, setText] = useState(query.search);
  const debounced = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);

  /* The last search value that crossed between this field and the URL, in either
     direction. Without it the two effects below echo each other: pressing back changes
     the URL, the field adopts it, the debounce then fires with the value the user just
     navigated away from, and it is written straight back. */
  const settled = useRef(query.search);

  useEffect(() => {
    if (debounced === settled.current) {
      return;
    }
    settled.current = debounced;
    onQueryChange({ search: debounced });
  }, [debounced, onQueryChange]);

  useEffect(() => {
    if (query.search === settled.current) {
      return;
    }
    settled.current = query.search;
    setText(query.search);
  }, [query.search]);

  /* A city from the URL that is not in the list yet, because the cities are still
     loading. Without this the select is handed a value it has no option for, which MUI
     reports as out of range and renders as empty, so a shared link looks like it lost
     its filter. */
  const cityOptions =
    query.city !== null && !cities.includes(query.city)
      ? [query.city, ...cities]
      : cities;

  return (
    <Box role="search">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={rootSx}>
        <TextField
          type="search"
          label="Search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          helperText="Matches name and email"
          sx={searchSx}
          slotProps={{
            input: {
              endAdornment:
                text === '' ? null : (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Clear search"
                      size="small"
                      edge="end"
                      onClick={() => setText('')}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        />
                      </svg>
                    </IconButton>
                  </InputAdornment>
                ),
            },
          }}
        />

        <TextField
          select
          label="City"
          value={query.city ?? ALL_CITIES}
          onChange={(event) =>
            onQueryChange({
              city: event.target.value === ALL_CITIES ? null : event.target.value,
            })
          }
          /* Not disabled when it fails. "All cities" is still in the list, and a user who
             arrived on a link with a city in it has to be able to clear it. */
          helperText={citiesFailed ? 'Could not load cities' : ' '}
          sx={citySx}
        >
          <MenuItem value={ALL_CITIES}>All cities</MenuItem>
          {cityOptions.map((city) => (
            <MenuItem key={city} value={city}>
              {city}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </Box>
  );
}
