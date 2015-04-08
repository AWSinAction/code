#
# Cookbook Name:: unreal-ircd
# Recipe:: default
#
# Copyright (C) 2014 Fred Hatfull
#
# 
#

user node['unreal']['user'] do
  comment "Unreal IRCd user"
  only_if { node['unreal']['create_user'] }
  shell "/bin/false"
  system true
end

directory ::File.dirname(node['unreal']['pidfile']) do
  owner    node['unreal']['user']
end

directory ::File.dirname(node['unreal']['tunefile']) do
  owner    node['unreal']['user']
end

include_recipe "unreal-ircd::source"

template "#{node['unreal']['unreal_directory']}/unrealircd.conf" do
  source "unrealircd.conf.erb"
  owner  node['unreal']['user']
  mode   "0644"
  notifies :reload, "service[unreal-ircd]"
end

if node['unreal']['config']['additional_config_files'].length > 0
  directory "#{node['unreal']['unreal_directory']}/unrealircd.conf.d" do
    owner node['unreal']['user']
  end

  node['unreal']['config']['additional_config_files'].each {|config_file, cookbook_opts|
    cookbook_file "#{node['unreal']['unreal_directory']}/unrealircd.conf.d/#{config_file}" do
      cookbook cookbook_opts['cookbook']
      source cookbook_opts['source']
      owner node['unreal']['user']
      mode "0644"
    end
  }

end

node['unreal']['config']['log'].each {|log_file, _|
  directory ::File.dirname(log_file) do
    owner node['unreal']['user']
  end
}

template "/etc/init.d/unreal-ircd" do
  source "init.erb"
  owner  "root"
  group  "root"
  mode   "0744"
  only_if { node['unreal']['manage_service'] }
end

service "unreal-ircd" do
  init_command "/etc/init.d/unreal-ircd"
  supports :reload => true, :restart => true, :status => true
  action [:enable, :start]
  only_if { node['unreal']['manage_service'] }
end
