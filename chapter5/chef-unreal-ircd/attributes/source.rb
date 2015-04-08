#
# Cookbook Name:: unreal-ircd
# Attributes:: source
#
# Copyright (C) 2014 Fred Hatfull
#
#
#
include_attribute 'unreal-ircd::default'

default['unreal']['source']['binary_destination'] = "/usr/bin/unreal-ircd"
default['unreal']['source']['fakelag_configurable'] = false  # Unreal says this is experimental
default['unreal']['source']['install_location'] = "/opt/unreal"
default['unreal']['source']['url'] = "http://unrealircd.org/downloads/Unreal#{node['unreal']['version']}.tar.gz"
