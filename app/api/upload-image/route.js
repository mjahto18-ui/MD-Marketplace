const res = await drive.files.create({
  requestBody: { 
    name: `prot_${Date.now()}_${file.name}`,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
  },
  media: { mimeType: file.type, body: Readable.from(buffer) },
  fields: "id",
});

// انقل الملكية لالك مشان ما يعطي Quota
await drive.permissions.create({
  fileId: res.data.id,
  requestBody: { 
    role: "owner", 
    type: "user",
    emailAddress: "mjahto18@gmail.com" // <-- حط ايميلك هون نفسو تبع الدرايف!
  },
  transferOwnership: true,
});

await drive.permissions.create({
  fileId: res.data.id,
  requestBody: { role: "reader", type: "anyone" },
});
