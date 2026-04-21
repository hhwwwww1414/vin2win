import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { PasswordField } from '@/components/auth/password-field';

test('password field hides the value by default and exposes a reveal control', () => {
  const markup = renderToStaticMarkup(
    <PasswordField
      id="login-password"
      value=""
      onChange={() => {}}
      autoComplete="current-password"
      visible={false}
      onToggleVisibility={() => {}}
    />
  );

  assert.match(markup, /type="password"/);
  assert.match(markup, /aria-label="Показать пароль"/u);
  assert.match(markup, /aria-pressed="false"/);
});

test('password field can render a visible password state with the hide control', () => {
  const markup = renderToStaticMarkup(
    <PasswordField
      id="register-password"
      value="hunter2"
      onChange={() => {}}
      autoComplete="new-password"
      visible
      onToggleVisibility={() => {}}
    />
  );

  assert.match(markup, /type="text"/);
  assert.match(markup, /aria-label="Скрыть пароль"/u);
  assert.match(markup, /aria-pressed="true"/);
});
