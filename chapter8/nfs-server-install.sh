#!/bin/bash -ex

yum -y install nfs-utils nfs-utils-lib
service rpcbind start
service nfs start

echo "/media/ephemeral0 *(rw,async)" >> /etc/exports
exportfs -a

# mount EBS backup volume
INSTANCEID=`curl -s http://169.254.169.254/latest/meta-data/instance-id`
aws --region $REGION ec2 attach-volume --volume-id $VOLUMEID --instance-id $INSTANCEID --device "/dev/xvdf"
while ! [ "$(fdisk -l | grep '/dev/xvdf' | wc -l)" -ge "1" ]; do sleep 10; done
mkdir /mnt/backup
echo "/dev/xvdf /mnt/backup ext4 defaults,nofail 0 2" >> /etc/fstab
mount -a

# backup cron
cat > /etc/cron.d/backup << EOF
SHELL=/bin/bash
PATH=/sbin:/bin:/usr/sbin:/usr/bin:/opt/aws/bin
MAILTO=root
HOME=/
0,15,30,45 * * * * rsync -av --delete --exclude /media/ephemeral0/ /mnt/backup/ ; fsfreeze -f /mnt/backup/ ; aws --region $REGION ec2 create-snapshot --volume-id $VOLUMEID --description "NFS backup"; fsfreeze -u /mnt/backup/
EOF
