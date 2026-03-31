import NiceModal, { useModal } from '@ebay/nice-modal-react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type { Difficulty } from '@/features/game/types';

interface IntroDialogProps {
  counts: Record<Difficulty, number>;
  onStart: (difficulty: Difficulty) => void;
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'American',
  medium: 'Tourist',
  hard: 'GeoGuessr enjoyer',
  veryHard: 'Impossible',
};

export const IntroDialog = NiceModal.create(
  ({ counts, onStart }: IntroDialogProps) => {
    const modal = useModal();
    const [difficulty, setDifficulty] = useState<Difficulty>('hard');

    return (
      <Dialog fullWidth maxWidth="sm" open={modal.visible}>
        <DialogTitle>Country Guesser</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>
              Type the name of the highlighted country on the globe.
            </Typography>
            <RadioGroup
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as Difficulty)
              }
            >
              {(Object.keys(difficultyLabels) as Difficulty[]).map((key) => (
                <FormControlLabel
                  key={key}
                  control={<Radio />}
                  label={`${difficultyLabels[key]} (${counts[key]} countries)`}
                  value={key}
                />
              ))}
            </RadioGroup>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              onStart(difficulty);
              void modal.hide();
            }}
          >
            Start
          </Button>
        </DialogActions>
      </Dialog>
    );
  },
);
