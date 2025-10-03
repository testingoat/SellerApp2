// MongoDB script to analyze FCM tokens
db = db.getSiblingDB('goatgoat');

print('=== FCM TOKEN ANALYSIS ===\n');

// 1. Count sellers with tokens
const sellersWithTokens = db.sellers.countDocuments({ 'fcmTokens.0': { $exists: true } });
const totalSellers = db.sellers.countDocuments({});
print('Total Sellers: ' + totalSellers);
print('Sellers with FCM Tokens: ' + sellersWithTokens);
print('Sellers without FCM Tokens: ' + (totalSellers - sellersWithTokens));
print('');

// 2. Token count distribution
print('=== TOKEN COUNT DISTRIBUTION ===');
const tokenStats = db.sellers.aggregate([
  {
    $project: {
      _id: 1,
      name: 1,
      email: 1,
      tokenCount: { $size: { $ifNull: ['$fcmTokens', []] } }
    }
  },
  {
    $group: {
      _id: '$tokenCount',
      count: { $sum: 1 }
    }
  },
  {
    $sort: { _id: 1 }
  }
]).toArray();

tokenStats.forEach(stat => {
  print(stat._id + ' tokens: ' + stat.count + ' sellers');
});
print('');

// 3. Top 10 sellers by token count
print('=== TOP 10 SELLERS BY TOKEN COUNT ===');
const topSellers = db.sellers.aggregate([
  {
    $project: {
      _id: 1,
      name: 1,
      email: 1,
      tokenCount: { $size: { $ifNull: ['$fcmTokens', []] } },
      tokens: '$fcmTokens'
    }
  },
  {
    $sort: { tokenCount: -1 }
  },
  {
    $limit: 10
  }
]).toArray();

topSellers.forEach(seller => {
  print('Seller: ' + seller.name + ' (' + seller.email + ')');
  print('  Token Count: ' + seller.tokenCount);
  if (seller.tokens && seller.tokens.length > 0) {
    seller.tokens.forEach((t, i) => {
      print('  Token ' + (i + 1) + ':');
      print('    Platform: ' + (t.platform || 'unknown'));
      print('    Added: ' + (t.createdAt || 'unknown'));
      print('    Last Used: ' + (t.lastUsed || 'never'));
    });
  }
  print('');
});

// 4. Average tokens per seller
const avgTokens = db.sellers.aggregate([
  {
    $project: {
      tokenCount: { $size: { $ifNull: ['$fcmTokens', []] } }
    }
  },
  {
    $group: {
      _id: null,
      avgTokens: { $avg: '$tokenCount' },
      maxTokens: { $max: '$tokenCount' },
      minTokens: { $min: '$tokenCount' }
    }
  }
]).toArray();

if (avgTokens.length > 0) {
  print('=== STATISTICS ===');
  print('Average Tokens per Seller: ' + avgTokens[0].avgTokens.toFixed(2));
  print('Max Tokens: ' + avgTokens[0].maxTokens);
  print('Min Tokens: ' + avgTokens[0].minTokens);
  print('');
}

// 5. Check for duplicate tokens
print('=== CHECKING FOR DUPLICATE TOKENS ===');
const allTokens = db.sellers.aggregate([
  { $unwind: '$fcmTokens' },
  {
    $group: {
      _id: '$fcmTokens.token',
      count: { $sum: 1 },
      sellers: { $push: { id: '$_id', name: '$name', email: '$email' } }
    }
  },
  { $match: { count: { $gt: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 5 }
]).toArray();

if (allTokens.length > 0) {
  print('Found ' + allTokens.length + ' duplicate tokens:');
  allTokens.forEach(token => {
    print('Token (first 20 chars): ' + token._id.substring(0, 20) + '...');
    print('  Used by ' + token.count + ' sellers:');
    token.sellers.forEach(s => {
      print('    - ' + s.name + ' (' + s.email + ')');
    });
    print('');
  });
} else {
  print('No duplicate tokens found.');
}
print('');

print('=== ANALYSIS COMPLETE ===');

