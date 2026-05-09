import Keyboard from 'react-simple-keyboard/build/index.modern.esm.js';
import 'react-simple-keyboard/build/css/index.css';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  KeyboardButtonAttributes,
  KeyboardButtonTheme,
  KeyboardReactInterface,
} from 'react-simple-keyboard';

interface MobileGuessKeyboardProps {
  onChange: (value: string) => void;
  onSubmit: () => void;
  value: string;
}

const MOBILE_KEYBOARD_LAYOUT = {
  default: [
    'q w e r t y u i o p',
    'a s d f g h j k l',
    'z x c v b n m',
    '{submit} {space} {bksp}',
  ],
};

function isKeyboardInstance(value: unknown): value is KeyboardReactInterface {
  return (
    typeof value === 'object' &&
    value !== null &&
    'setInput' in value &&
    typeof value.setInput === 'function'
  );
}

export function MobileGuessKeyboard({
  onChange,
  onSubmit,
  value,
}: MobileGuessKeyboardProps) {
  const keyboardRef = useRef<KeyboardReactInterface | null>(null);
  const isPointerActiveRef = useRef(false);
  const pendingSubmitRef = useRef(false);
  const submitTimeoutRef = useRef<number | null>(null);
  const onSubmitRef = useRef(onSubmit);
  const buttonTheme = useMemo<KeyboardButtonTheme[]>(
    () => [
      {
        buttons: '{submit}',
        class: 'hg-button-submit',
      },
      {
        buttons: '{space}',
        class: 'hg-button-space',
      },
      {
        buttons: '{bksp}',
        class: 'hg-button-backspace',
      },
    ],
    [],
  );
  const buttonAttributes = useMemo<KeyboardButtonAttributes[]>(
    () => [
      {
        attribute: 'aria-label',
        buttons: '{submit}',
        value: 'Submit guess',
      },
      {
        attribute: 'aria-label',
        buttons: '{space}',
        value: 'Space',
      },
      {
        attribute: 'aria-label',
        buttons: '{bksp}',
        value: 'Backspace',
      },
    ],
    [],
  );

  useEffect(() => {
    keyboardRef.current?.setInput(value);
  }, [value]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(
    () => () => {
      if (submitTimeoutRef.current !== null) {
        window.clearTimeout(submitTimeoutRef.current);
      }
    },
    [],
  );

  const scheduleSubmitAfterActivation = useCallback(() => {
    if (submitTimeoutRef.current !== null) {
      window.clearTimeout(submitTimeoutRef.current);
    }

    submitTimeoutRef.current = window.setTimeout(() => {
      submitTimeoutRef.current = null;
      onSubmitRef.current();
    }, 0);
  }, []);

  const completePointerActivation = useCallback(() => {
    const shouldSubmit = pendingSubmitRef.current;
    isPointerActiveRef.current = false;
    pendingSubmitRef.current = false;

    if (shouldSubmit) {
      scheduleSubmitAfterActivation();
    }
  }, [scheduleSubmitAfterActivation]);

  const cancelPointerActivation = useCallback(() => {
    isPointerActiveRef.current = false;
    pendingSubmitRef.current = false;
  }, []);

  return (
    <div
      className="guess-mobile-keyboard-bleed"
      data-testid="guess-mobile-keyboard"
      onPointerCancelCapture={cancelPointerActivation}
      onPointerDownCapture={(event) => {
        isPointerActiveRef.current = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerUpCapture={completePointerActivation}
    >
      <Keyboard
        buttonAttributes={buttonAttributes}
        buttonTheme={buttonTheme}
        display={{
          '{bksp}': '⌫',
          '{space}': 'Space',
          '{submit}': 'Enter',
        }}
        keyboardRef={(instance: unknown) => {
          keyboardRef.current = isKeyboardInstance(instance) ? instance : null;
        }}
        layout={MOBILE_KEYBOARD_LAYOUT}
        mergeDisplay
        theme="hg-theme-default country-dash-mobile-keyboard"
        onChange={onChange}
        onKeyPress={(button) => {
          if (button === '{submit}') {
            if (isPointerActiveRef.current) {
              pendingSubmitRef.current = true;
              return;
            }

            scheduleSubmitAfterActivation();
          }
        }}
      />
    </div>
  );
}
