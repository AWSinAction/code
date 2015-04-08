#
# Cookbook Name:: unreal-ircd
# Attributes:: default
#
# Copyright (C) 2014 Fred Hatfull
#
#
#

default['unreal']['create_user'] = true
default['unreal']['enable_sanick'] = false
default['unreal']['manage_service'] = true
default['unreal']['pidfile'] = "/var/run/unreal-ircd/unreal.pid"
default['unreal']['tunefile'] = "/var/run/unreal-ircd/unreal.tune"
default['unreal']['user'] = "unreal"
default['unreal']['version'] = "3.2.10.4"

default['unreal']['config']['additional_config_files'] = []

default['unreal']['config']['admin'] = []

default['unreal']['config']['alias_includes'] = []

default['unreal']['config']['allow'] = [
	{
		"ip"        => "*",
		"hostname"  => "*@*",
		"class"     => "clients"
	}
]

default['unreal']['config']['allows']['channel'] = []
default['unreal']['config']['allows']['dcc'] = []

default['unreal']['config']['badword'] = []

default['unreal']['config']['bans']['ips'] = []
default['unreal']['config']['bans']['nicks'] = [
	{
		"mask" => "*C*h*a*n*S*e*r*v*",
		"reason" => "Reserved for Services"
	},
	{
		"mask" => "*N*i*c*k*S*e*r*v*",
		"reason" => "Reserved for Services"
	},
	{
		"mask" => "*O*p*e*r*S*e*r*v*",
		"reason" => "Reserved for Services"
	}
]
default['unreal']['config']['bans']['realnames'] = []
default['unreal']['config']['bans']['servers'] = []
default['unreal']['config']['bans']['users'] = []
default['unreal']['config']['bans']['versions'] = []

default['unreal']['config']['cgiirc'] = []

default['unreal']['config']['class'] = {
	"clients" => {
		"pingfreq"   => 90,
		"maxclients" => 50,
		"sendq"      => 100000,
		"recvq"      => 8000
	},
	"servers" => {
		"pingfreq"   => 90,
		"maxclients" => 3,
		"sendq"      => 1000000,
		"connfreq"   => 100
	}
}

default['unreal']['config']['deny']['channel'] = []
default['unreal']['config']['deny']['dcc'] = [
	{
		"filename" => "*",
		"reason"   => "File transfer disabled. There's probably a better way!"
	}
]
default['unreal']['config']['deny']['link'] = []
default['unreal']['config']['deny']['version'] = []

default['unreal']['config']['drpass']["die"] = {
	"text"      => "$BJJ4qFPm$Ww1Ngzt8eWYDlxgZVcpATw==",
	"auth_type" => "md5"
}
default['unreal']['config']['drpass']["restart"] = {
	"text"      => "$BJJ4qFPm$Ww1Ngzt8eWYDlxgZVcpATw==",
	"auth_type" => "md5"
}

default['unreal']['config']['exceptions']['bans'] = []
default['unreal']['config']['exceptions']['tkls'] = []
default['unreal']['config']['exceptions']['throttles'] = []

default['unreal']['config']['files'] = {
	"pidfile"  => default['unreal']['pidfile'],
	"tunefile" => default['unreal']['tunefile']
}

default['unreal']['config']['help'] = []

default['unreal']['config']['link'] = {}

default['unreal']['config']['listen'] = [
	{
		"ip"      => "*",
		"port"    => 6697,
		"options" => ["ssl", "clientsonly"]
	}
]

default['unreal']['config']['log'] = {
	"/var/log/unreal-ircd.log" => {
		"flags"   => ["errors", "kills", "oper", "oper-override", "tkl", "sadmin-commands", "server-connects", "spamfilter"],
		"maxsize" => "500MB"
	}
}

default['unreal']['config']['me']['name'] = node["fqdn"]
default['unreal']['config']['me']['info'] = "IRC on #{node['unreal']['config']['me']['name']}"
default['unreal']['config']['me']['numeric'] = 1

default['unreal']['config']['modules'] = ["commands", "cloak"]

default['unreal']['config']['official-channels'] = []

default['unreal']['config']['oper'] = {}
# An example oper
# This is commented because of https://coderanger.net/2013/06/arrays-and-chef/
# {
# 	"admin_user" => {
# 		"class"         => "clients",
# 		"flags"         => ["netadmin", "can_zline", "can_gzline", "can_gkline", "global"],
# 		"from"          => ["*@*"],
# 		"maxlogins"     => 1,
# 		"modes"         => "",
# 		"password"      => {
# 			"text"      => "oper_password",
# 			"auth_type" => "plaintext"
# 		},
# 		"require-modes" => "r",
# 		"swhois"        => "I'm a default IRC oper from chef-unreal-ircd!"
# 	}
# }

# These first three options are required. The rest are optional.
default['unreal']['config']['set']['cloak-keys'] = ["change", "these", "please!"]
default['unreal']['config']['set']['kline-address'] = "";
default['unreal']['config']['set']['services-server'] = "";
default['unreal']['config']['set']['allow-userhost-change'] = ""
default['unreal']['config']['set']['anti-flood'] = {}
default['unreal']['config']['set']['anti-spam-quit-message-time'] = ""
default['unreal']['config']['set']['auto-join'] = ""
default['unreal']['config']['set']['ban-version-tkl-time'] = ""
default['unreal']['config']['set']['channel-command-prefix'] = ""
default['unreal']['config']['set']['check-target-nick-bans'] = ""
default['unreal']['config']['set']['default-bantime'] = ""
default['unreal']['config']['set']['default-ipv6-clone-mask'] = ""
default['unreal']['config']['set']['default-server'] = ""
default['unreal']['config']['set']['dns'] = {}
default['unreal']['config']['set']['gline-address'] = ""
default['unreal']['config']['set']['help-channel'] = ""
default['unreal']['config']['set']['hiddenhost-prefix'] = ""
default['unreal']['config']['set']['hosts'] = {}
default['unreal']['config']['set']['ident'] = {}
default['unreal']['config']['set']['level-on-join'] = ""
default['unreal']['config']['set']['maxbanlength'] = ""
default['unreal']['config']['set']['maxbans'] = ""
default['unreal']['config']['set']['maxchannelsperuser'] = ""
default['unreal']['config']['set']['maxdccallow'] = ""
default['unreal']['config']['set']['modef-default-unsettime'] = ""
default['unreal']['config']['set']['modef-max-unsettime'] = ""
default['unreal']['config']['set']['modes-on-connect'] = ""
default['unreal']['config']['set']['modes-on-join'] = ""
default['unreal']['config']['set']['modes-on-oper'] = ""
default['unreal']['config']['set']['network-name'] = ""
default['unreal']['config']['set']['nopost'] = {}
default['unreal']['config']['set']['oper-auto-join'] = ""
default['unreal']['config']['set']['oper-only-stats'] = []
default['unreal']['config']['set']['options'] = {}
default['unreal']['config']['set']['ping-cookie'] = ""
default['unreal']['config']['set']['pingpong-warning'] = ""
default['unreal']['config']['set']['prefix-quit'] = ""
default['unreal']['config']['set']['restrict-channelmodes'] = ""
default['unreal']['config']['set']['restrict-extendedbans'] = ""
default['unreal']['config']['set']['restrict-usermodes'] = ""
default['unreal']['config']['set']['sasl-server'] = ""
default['unreal']['config']['set']['silence-limit'] = ""
default['unreal']['config']['set']['snomask-on-connect'] = ""
default['unreal']['config']['set']['snomask-on-oper'] = ""
default['unreal']['config']['set']['spamfilter'] = {}
default['unreal']['config']['set']['ssl'] = {}
default['unreal']['config']['set']['static-part'] = ""
default['unreal']['config']['set']['static-quit'] = ""
default['unreal']['config']['set']['stats-server'] = ""
default['unreal']['config']['set']['throttle'] = {}
default['unreal']['config']['set']['timesynch'] = {}
default['unreal']['config']['set']['watch-away-notification'] = ""
default['unreal']['config']['set']['who-limit'] = ""

default['unreal']['config']['spamfilter'] = []

default['unreal']['config']['tld'] = []

default['unreal']['config']['use_default_spamfilter'] = true

default['unreal']['config']['ulines'] = []

default['unreal']['config']['vhosts'] = []
