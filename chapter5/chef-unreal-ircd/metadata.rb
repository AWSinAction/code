name             'unreal-ircd'
maintainer       'Fred Hatfull (fhats)'
maintainer_email 'fred.hatfull@gmail.com'
license          'MIT'
description      'Installs/Configures chef-unreal-ircd'
long_description 'Installs/Configures chef-unreal-ircd'
version          '0.1.2'

provides "unreal-ircd::default"
provides "unreal-ircd::source"

recipe "unreal-ircd::default", "Use me to install UnrealIRCd from source and configure"
supports "ubuntu"

depends 'build-essential'
