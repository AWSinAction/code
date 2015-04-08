#
# Cookbook Name:: unreal-ircd
# Recipe:: source
#
# Copyright (C) 2014 Fred Hatfull
#
#
#

# This recipe downloads, unpacks, configures, and builds the Unreal IRC daemon.
# At the time of writing, Unreal is completely unavailable from any package
# manager due to the way it does configuration at build-time.
#
# In general, the flow for building Unreal is as follows:
#
# * Download and unpack the source. I unpack the source to somewhere outside
#   of the Chef cache because Unreal will essentially run out of there after
#   being built.
# * Twiddle any bits of source. For things like fakelag configurability we need
#   to sed some bits of some Unreal headers.
# * Template up a `config.settings` file with some information about how Unreal
#   should be built. I tried to set some sane defaults, but these should be
#   configurable via chef attributes. My intent is that chef recompile Unreal
#   whenever these settings are changed. This is a TODO, since I've just
#   defaulted to what the Config script defaults to. Patches to change this are
#   welcome.
# * Run Config to configure Unreal for compilation
# * Build Unreal and any additional modules for Unreal
# * Provide links to built executables
# * Configure a system service for Unreal
#
# I've built and tested this only on Ubuntu. Patches to improve support for
# other distributions happily accepted.

include_recipe "build-essential::default"

unreal_version = node['unreal']['version'].to_s
unreal_tarball = "Unreal#{unreal_version}.tar.gz"
unreal_tarball_url = node['unreal']['source']['url'] ||
                     "http://unrealircd.org/downloads/#{unreal_tarball}"

build_base_path = Chef::Config['file_cache_path'].to_s || '/tmp'
local_tarball_path = "#{build_base_path}/#{unreal_tarball}"
unpacked_source = "#{node['unreal']['source']['install_location']}/#{::File.basename(local_tarball_path, ".tar.gz")}"

node.default['unreal']['unreal_directory'] = unpacked_source

directory node['unreal']['source']['install_location'] do
  mode "0755"
  owner node['unreal']['user']
end

# Dependencies to build Unreal that aren't in build-essential
# TODO(fhats): This could probably become conditional in case you don't care
# about compiling in SSL support...
package "libssl-dev"

remote_file unreal_tarball_url do
  source   unreal_tarball_url
  path     local_tarball_path
  backup   false
  owner    node['unreal']['user']
  mode     "0644"
  action :create_if_missing
end

bash 'untar unreal source' do
  cwd ::File.dirname(local_tarball_path)
  code <<-EOH
    tar zxf #{::File.basename(local_tarball_path)} -C #{::File.dirname(unpacked_source)} --no-same-permissions
    chmod a+rx #{::File.dirname(unpacked_source)}/*
    EOH
  user    node['unreal']['user']
  not_if { ::File.directory?(unpacked_source) }
end

bash 'sed FAKELAG_CONFIGURABLE in unreal config' do
  cwd unpacked_source
  code "sed -i 's/#undef FAKELAG_CONFIGURABLE/#define FAKELAG_CONFIGURABLE/g' include/config.h"
  user    node['unreal']['user']
  only_if { node['unreal']['source']['fakelag_configurable'] }
end

remote_file "m_sanick.c" do
  source "https://gist.githubusercontent.com/fhats/5364cd0d4550be5e6340/raw/41bbdfa8b5227ec0750e7919799961705119ccc5/m_sanick.c"
  path   "#{unpacked_source}/src/modules/m_sanick.c"
  only_if { node['unreal']['enable_sanick'] }
  owner    node['unreal']['user']
  notifies :touch, "template[#{unpacked_source}/config.settings]", :immediately
  action :create_if_missing
end

template "#{unpacked_source}/config.settings" do
  source "config.settings.erb"
  variables(
    :source_path => unpacked_source
  )
  owner    node['unreal']['user']
  notifies :run, "bash[config unreal]", :immediately
end

bash 'config unreal' do
  action :nothing
  cwd unpacked_source
  code "./Config -nointro -quick"
  user    node['unreal']['user']
  notifies :run, "bash[make unreal]", :immediately
end

bash 'make unreal' do
  action :nothing
  cwd unpacked_source
  code "make && chmod a+rx unreal"
  user    node['unreal']['user']
  notifies :run, "bash[compile m_sanick]", :immediately
  notifies :restart, "service[unreal-ircd]"
end

bash 'compile m_sanick' do
  action :nothing
  cwd unpacked_source
  code "make custommodule MODULEFILE='m_sanick'"
  user    node['unreal']['user']
  only_if { node['unreal']['enable_sanick'] }
end

link node['unreal']['source']['binary_destination'] do
  to "#{unpacked_source}/unreal"
end

# Here we fake having ircd.log and ircd.pid in the source directory since
# the unreal management script naively looks for them.
# We can't do anything about the log (since you might want to put that
# elsewhere), but we do try to symlink ircd.pid to where the real pidfile
# lives.

file "#{unpacked_source}/ircd.log" do
  action :touch
end

link "#{unpacked_source}/ircd.pid" do
  to node['unreal']['pidfile']
end

