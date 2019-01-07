#!/bin/bash
unset npm_config_prefix
export NVM_DIR="$(realpath $HOME/.nvm)"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" || {
  echo "you need nvm (https://github.com/creationix/nvm)\ncurl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash"; exit 1
}

nvm --version 1>/dev/null 2>&1
[ $? -ne 0 ] && echo "you need nvm (https://github.com/creationix/nvm)\ncurl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash" && exit 1

nvm i
