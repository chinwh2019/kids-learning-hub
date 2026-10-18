/* ================= Stories (text kept as written) ================= */
const STORIES=[
{id:'dog',title:'The man who helped a thirsty dog',date:'2026-10-16',theme:'Kindness to animals',tint:'#56c7b4',
 source:'Sahih al-Bukhari and Sahih Muslim',sourceLong:'Hadith of the man who gave water to a thirsty dog, in Sahih al-Bukhari and Sahih Muslim.',
 value:{name:'Kindness',icon:'paw'},cover:'dogDrinks',
 pages:[
  {scene:'desertWalk',text:['A long time ago, a man was walking through the desert. The sun was hot, and he was very thirsty.']},
  {scene:'wellDrink',text:['He found a well, climbed down carefully, and drank some cool water. Alhamdulillah, he felt better.']},
  {scene:'thirstyDog',text:['When he came back up, he saw a dog nearby. The dog was panting and licking the dry earth. It looked so thirsty, just like he had been.']},
  {scene:'shoeClimb',text:['The man thought, "This dog is thirsty the way I was thirsty." So he climbed down the well again, filled his shoe with water, held it carefully in his mouth so he could climb, and gave the water to the dog.']},
  {scene:'dogDrinks',text:['The dog drank and drank until it was happy.','Allah was so pleased with this kind act that He forgave the man\'s sins.']},
  {scene:'kindNight',text:['The Prophet Muhammad ﷺ told us this story so we would remember that kindness to animals, and to every living thing, is kindness that Allah loves.']}
 ],
 lesson:'Even a small act of kindness, like giving water to a thirsty animal, can mean a lot to Allah.',
 ask:'If you saw a thirsty bird or a hungry cat today, what is one kind thing you could do to help?',
 tip:'Plan one small kindness together for tomorrow, like putting out a bowl of water for birds, and remind your child of the man and the dog when you do it.'},
{id:'ant',title:'Prophet Sulayman and the little ant',date:'2026-10-17',theme:'Gentleness and gratitude',tint:'#f2b84b',
 source:'Quran, Surah An-Naml 27:17-19',sourceLong:'Quran, Surah An-Naml (The Ant), verses 17 to 19.',
 value:{name:'Gratitude',icon:'ant'},cover:'antCall',
 pages:[
  {scene:'kingdom',text:['Prophet Sulayman (Solomon), peace be upon him, was a very special prophet. Allah gave him a huge army of people, jinn, and birds, and He taught him to understand the speech of animals.']},
  {scene:'march',text:['One day Sulayman was marching with his whole army. They came to a valley full of ants.']},
  {scene:'antCall',text:['A little ant saw the big army coming and called out to the others: "O ants! Go into your homes, so that Sulayman and his soldiers don\'t crush you without realising it!"']},
  {scene:'gratitude',text:['Sulayman heard the tiny ant, and he smiled. He wasn\'t angry. He was happy and thankful. He prayed: "My Lord, help me to be grateful for the blessings You gave me and my parents, and help me do good deeds that please You."'],
   dua:{ar:'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ',ref:'Surah An-Naml 27:19'}},
  {scene:'safeHome',text:['So the great king stopped his whole army to look after a few little ants. And the little ant looked after her friends too.']}
 ],
 lesson:'Strong people are gentle with small creatures, and when Allah blesses us, we say thank you to Him.',
 ask:'The ant warned her friends to keep them safe. How can you look out for your brothers, sisters, or friends?',
 tip:'Before lights out, take turns naming three blessings from today and say Alhamdulillah after each one, the way Sulayman thanked Allah.'},
{id:'gold',title:'The honest men and the jar of gold',date:'2026-10-18',theme:'Honesty',tint:'#f08f80',
 source:'Sahih al-Bukhari 3472, Sahih Muslim 1721',sourceLong:'Sahih al-Bukhari 3472 and Sahih Muslim 1721, narrated by Abu Huraira.',
 value:{name:'Honesty',icon:'jar'},cover:'jarGlow',
 pages:[
  {scene:'sale',text:['Our Prophet Muhammad ﷺ once told his companions a true story about two men who lived long, long ago, before his time.','One man owned a piece of land, and he sold it to another man.']},
  {scene:'digging',text:['The new owner was happy with his land, and he began to dig in it. Suddenly, his shovel hit something hard. He dug a little more and found a jar. He opened it, and it was full of shining gold!']},
  {scene:'jarGlow',text:['Now, he could have kept it all for himself. Nobody had seen him find it. But he knew Allah sees everything. So he picked up the jar and went straight to the man who sold him the land.']},
  {scene:'backForth',text:['"Here, take your gold," he said. "I only bought the land from you. I didn\'t buy any gold."','But the other man shook his head. "No, no," he said. "I sold you the land and everything in it. The gold belongs to you."']},
  {scene:'wiseMan',text:['Each man wanted the other to have the gold! Neither of them wanted to take something that might not be his. So they went to a wise man and asked him to decide.','The wise man listened. Then he asked, "Do you have any children?"','The first man said, "I have a son."\nThe second man said, "I have a daughter."']},
  {scene:'wedding',text:['The wise man smiled. "Then let your son and your daughter marry each other. Spend some of the gold on them, and give the rest in charity to help others."']},
  {scene:'charity',text:['And so the gold that both men were too honest to keep became a blessing for their children and for the poor.']}
 ],
 lesson:'Be honest even when nobody is watching, because Allah always sees us. When we don\'t take what isn\'t ours, Allah puts blessing (barakah) in what we have.',
 ask:'If you found some money on the floor at school or in the park, and nobody saw you, what would you do? Why?',
 tip:'Share a time you returned something that was not yours, even a small thing. Children remember the stories their parents tell about themselves.'}
];

const GLOSS={
 alhamdulillah:{ar:'ٱلْحَمْدُ لِلَّٰهِ',tr:'Alhamdulillah',m:'All praise and thanks belong to Allah. We say it when something good happens.'},
 'ﷺ':{ar:'صَلَّى ٱللَّٰهُ عَلَيْهِ وَسَلَّمَ',tr:'Sallallahu alayhi wa sallam',m:'May Allah send blessings and peace upon him. We say it after the name of the Prophet Muhammad.'},
 jinn:{ar:'جِنّ',tr:'Jinn',m:'Beings that Allah created from smokeless fire. We cannot see them, but they are real.'},
 barakah:{ar:'بَرَكَة',tr:'Barakah',m:'Blessing from Allah that makes a little become a lot of good.'},
 sulayman:{ar:'سُلَيْمَان',tr:'Sulayman',m:'A prophet and a king. In English his name is Solomon. Allah let him understand the birds and the little ant.'},
 allah:{ar:'ٱللَّٰه',tr:'Allah',m:'The One God who created everything. He sees everything and loves kindness.'}
};

