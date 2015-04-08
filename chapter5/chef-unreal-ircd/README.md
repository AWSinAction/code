# chef-unreal-ircd

This is a cookbook for installing and managing the Unreal IRC daemon.

## Quick Start

Simply include the default recipe from the `unreal-ircd` cookbook in your
node's run list:

    recipe[unreal-ircd]

This recipe will download and compile the Unreal IRCd source and template a
configuration file. By default it will also create a user to run the IRC daemon
as and an upstart service to manage the daemon.

Currently this cookbook only supports Ubuntu, and has only been tested on
Ubuntu 14.04. Patches to add support for other operating systems will gladly be
accepted and shouldn't be too difficult; I simply didn't bother out of
selfishness and laziness :)

## Configuration

Configuring Unreal with this cookbook essentially boils down to mapping node
attributes to Unreal configuration stanzas. For a complete listing of the
configuration options available in Unreal, see the
[Unreal documentation](http://www.unrealircd.com/files/docs/unreal32docs.html).

Most configuration options can be set as arrays of dicitonaries on the node's
`unreal::config` attribute.

There are a few special options that govern the way this cookbook manages the
configuration of your IRCd:

* `node['unreal']['create_user']` - Should this cookbook create a user to run
  the IRCd as (defaults to `true`)?
* `node['unreal']['user']` - The user to run the IRC daemon as. Will be created
  if `node['unreal']['create_user']` is set (defaults to `unreal`).
* `node['unreal']['manage_service']` - Whether or not this cookbook should
  attempt to manage the IRCd as a service (defaults to `true`). Use this if
  you want to supply your own init script or manage the service with a
  different init manager.
* `node['unreal']['pidfile']` - Where to keep the pidfile for the IRCd
  (defaults to `/var/run/unreal-ircd/unreal.pid`).
* `node['unreal']['tunefile']` - Where to keep the tunefile for the IRCd
  (defaults to `/var/run/unreal-ircd/unreal.tune`).
* `node['unreal']['version']` - Which version of Unreal to install.
* `node['unreal']['enable_sanick']` - Compile and load the third-party `sanick`
  module (defaults to `false`)?
* `node['unreal']['source']['binary_destination']` - Where to link the compiled
  IRCd binary to (defaults to `/usr/bin/unreal-ircd`).
* `node['unreal']['source']['fakelag_configurable']` - Whether or not to enable
  experimental fakelag support during compile-time (defaults to `false`).
* `node['unreal']['source']['install_location']` - Where to store the Unreal
  source, compilation artifacts, and build products (defaults to `/opt/unreal`).
* `node['unreal']['source']['url']` - Where to download the Unreal source from.
  Defaults to the official download link of the requested Unreal version.

Below is a set of configuration details for some common sections of Unreal
configuration supported by this cookbook. For a complete enumeration of what is
supported by this cookbook, see `attributes/default.rb` and
`templates/default/unrealircd.conf`. As always, the
[Unreal documentation](http://www.unrealircd.com/files/docs/unreal32docs.html)
is the canonical source of truth for information about all of the listed
options.

### Configuring IRCd Identity (the "Me" block)

* `node['unreal']['config']['me']['name']` - The name of this IRC server
  (defaults to your node's FQDN).
* `node['unreal']['config']['me']['info']` - The info line for this server.
* `node['unreal']['config']['me']['numeric']` - The numeric for this server.
  Must be unique to this server on this network (defaults to 1).

#### Example

    "me": {
      "name": "irc.beefheap.com",
      "info": "BeefHeap on the LondonBroil IRC network",
      "numeric": 20
    }

### Configuring Admin Lines (the "Admin" block)

* `node['unreal']['config']['admin']` - An array of lines to be included in the
  text of an `/admin` request (defaults to `[]`).

#### Example

    "admin": [
      "David Bailey Thompson-Price",
      "Don't Be Talkin' Poetry"
    ]

### Configuring Client Classes (the "Class" block)

* `node['unreal']['config']['class']` - A mapping of class names to class
  options. Options may include any options found on the
  [class block docs](http://www.unrealircd.com/files/docs/unreal32docs.html#classblock).
  Defaults to two classes: `clients` and `servers`.

#### Example

    "class": {
      "clients": {
        "pingfreq": 90,
        "maxclients": 50,
        "sendq": 100000,
        "recvq": 8000
      },
      "servers": {
        "pingfreq": 90,
        "maxclients": 3,
        "sendq": 1000000,
        "connfreq": 100
      }
    }

### Allowing Clients to Connect (the "Allow" block)

* `node['unreal']['config']['allow']` - An array of allow block options.
  Options may be configured as per the
  [allow block documentation](http://www.unrealircd.com/files/docs/unreal32docs.html#allowblock).
  Defaults to allowing all clients from everywhere.

#### Example

    "allow": [
      {
        "ip": "*",
        "hostname": "*@*",
        "class": "clients"
      }
    ]

### Telling the Server Where to Listen (the "Listen" block)

* `node['unreal']['config']['listen']` - An array of listen block options. Each
  array element should be a mapping containing the keys `ip`, `port`, and
  `options`. Options may be configured as per the
  [listen block documentation](http://www.unrealircd.com/files/docs/unreal32docs.html#listenblock).
  Defaults to listening for SSL connections on port 6697.

#### Example

    "listen": [
      {
        "ip": "*",
        "port": 6667,
        "options": []
      },
      {
        "ip": "*",
        "port": 6697,
        "options": ["ssl", "clientsonly"]
      },
      {
        "ip": "127.0.0.1",
        "port": 6670
        "options": ["ssl", "serversonly"]
      }
    ]

### Configuring Operators (the "Oper" block)

* `node['unreal']['config']['oper']` - A mapping of operator names to options
  for that operator. See the
  [oper block documentation](http://www.unrealircd.com/files/docs/unreal32docs.html#operblock)
  for more details. Defaults to an oper called `admin_user` with a password of
  `oper_password`. You probably will want to change this. To configure no opers,
  set this block to an empty mapping (`{}`).

#### Example

    "oper": {
      "admin_user": {
        "class": "clients",
        "flags": ["netadmin", "can_gzline", "global"],
        "from": ["*@*"],
        "maxlogins": 1,
        "modes": "",
        "password": {
          "text": "oper_password",
          "auth_type": "plaintext"
        },
        "require-modes": "r",
      }
    }

### Configuring Logging (the "Log" block)

* `node['unreal']['config']['log']` - A mapping of log files to options about
  logging to those files. Defaults to logging a variety of information to
  `/var/log/unreal-ircd.log`. See the
  [log block documentation](http://www.unrealircd.com/files/docs/unreal32docs.html#logblock)
  for more information.

#### Example

    "log": {
      "/var/log/unreal-ircd.log": {
        "flags": ["kills", "server-connects", "spamfilter"],
        "maxsize": "20MB"
      },
      "/var/log/unreal-errors.log": {
        "flags": ["errors"],
        "maxsize": "1GB"
      }
    }

### Adding ULines (the "ULines" block)

* `node['unreal']['config']['ulines']` - An array of servers to ULine, which
  grants them special permissions. Useful for stats and services servers.

#### Example

    "ulines": [
      "services.beefheap.com"
    ]

### Linking Servers (the "Link" block)

* `node['unreal']['config']['link']` - A mapping of server address to linking
  options. Can be used to link IRC servers together in a network. This can be
  somewhat tricky to do; start by reading Unreal's comprehensive
  [link block documentation](http://www.unrealircd.com/files/docs/unreal32docs.html#linkblock)
  to learn more about linking servers and the options you can set to do so.

#### Example

    "link": {
      "chatter.weknowjustthe.place": {
        "username": "*",
        "hostname": "chatter.weknowjustthe.place",
        "bind-ip": "*",
        "port": 6670,
        "hub": "*",
        "password-connect": "LiNk",
        "password-receive": "LiNk",
        "class": "servers",
        "options": ["autoconnect", "ssl"]
      }
    }

### Network Settings (the "Set" block)

* `node['unreal']['config']['set']['cloak-keys']` - The cloak keys to use for
  cloaking hostnames on this network. **Required** -- do not leave these as the
  default, or anyone will be able to trivially uncloak users' hostnames!
* `node['unreal']['config']['set']['kline-address']` - An email address where
  questions about K:lines should be sent to. **Required**.
* `node['unreal']['config']['set']['services-server']` - Specifies the name
  of the server that services bots are connected to. Although this field is
  **required**, it can safely be set to garbage if you aren't running services.

This cookbook supports *many* of the Unreal set options, which are too numerous
to enumerate here. Please see the Unreal
[set block documentation](http://www.unrealircd.com/files/docs/unreal32docs.html#setblock)
for more information about options available in this block. You can also find
an enumeration of the supported set values in `attributes/default.rb`.

#### Example

    "set": {
      "cloak-keys": ["generate", "using", "unreal-ircd"],
      "kline-address": "admin@beefheap.com",
      "services-server": "services.beefheap.com",
      "help-channel": "#help",
      "hosts": {
        "local": "locop@beefheap.com",
        "global": "globop@beefheap.com"
      },
      "network-name": "BeefHeap IRC Network",
    }

### Supplying Additional Configuration Files

The `node['unreal']['config']['additional_config_files']` setting provides a
mechanism to let you include your own configuration files to be included by
Unreal. To take advantage of this, specify a mapping of mappings to this
attribute. The mapping should be keyed by the name of the file as it should be
created on the filesystem, and the value of the mapping should be another
mapping with the values `cookbook` and `source`. These values will be passed
to the `cookbook_file` type to be included. Specifying this will drop files
into a directory called `unrealircd.conf.d` in the Unreal install directory.

#### Example

    "additional_config_files": {
      "opers.conf": {
        "cookbook": "my-ircd-cookbook",
        "source": "opers.conf"
      }
    }

## Troubleshooting

If something goes wrong during installation, there's a few places you can look:

* `/var/chef/cache` contains the downloaded source tarball. If that's not there
  then something may be wrong.
* `/opt/unreal` by default contains the unpacked source for Unreal after
  download. From here you could try running `./Config` and `make` to diagnose
  build issues.

If Unreal refuses to load your configuration, take a look at the templated
configuration file (by default in `/opt/unreal/Unreal<version>/unrealircd.conf`)
and check for any invalid stanzas or parse errors. If I screwed up the
configuration templating I'll happily accept pull requests or issues to fix!

If your IRCd is behaving in a way you aren't expecting it to, it might be
because you're using default configuration attributes. I've tried to provide
a number of sane-like defaults to some of the configuration options in the hope
of providing illustrative examples of how to use those configuration attributes;
however, the Unreal folks really recommend you read their documentation
thoroughly to understand how to configure their IRCd, and this cookbook can not
and will not provide a suitable abstraction away from the complexity of running
an IRCd. If you are having trouble, I'd strongly recommend comparing your
resulting `unrealircd.conf` with the documentation provided on the official
Unreal website.
