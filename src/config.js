import Conf from 'conf';

const conf = new Conf({ projectName: 'commitcraft' });

export function getConfig() {
  return {
    provider: conf.get('provider'),
    apiKey: conf.get('apiKey'),
    model: conf.get('model'),
    host: conf.get('host'),
  };
}

export function setConfig(values) {
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null) {
      conf.set(key, value);
    }
  }
}

export function hasConfig() {
  return !!conf.get('provider');
}

export function clearConfig() {
  conf.clear();
}
